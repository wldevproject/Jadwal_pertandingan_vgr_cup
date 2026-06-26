(() => {
  const APP_NAME = 'VGR 5 Badminton Cup 2026';
  const ICON = './app-icon.svg';
  const REMINDER_KEY = 'vgr5cup2026.reminder';
  const INSTALL_SELECTOR = '[data-install-pwa]';
  const SAVE_SELECTOR = '[data-save-calendar]';
  const REMIND_SELECTOR = '[data-remind-next]';
  const COUNTDOWN_SELECTOR = '[data-countdown-target]';

  let installPrompt = null;
  let reminderTimer = null;

  function escapeIcs(value) {
    return String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }

  function formatIcsDate(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return [
      date.getUTCFullYear(),
      pad(date.getUTCMonth() + 1),
      pad(date.getUTCDate()),
      'T',
      pad(date.getUTCHours()),
      pad(date.getUTCMinutes()),
      pad(date.getUTCSeconds()),
      'Z',
    ].join('');
  }

  function downloadText(filename, content, type = 'text/calendar') {
    const blob = new Blob([content], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function getScheduleContext() {
    return window.__vgrCurrentSchedule || null;
  }

  function scheduleEntries() {
    const ctx = getScheduleContext();
    if (!ctx || !Array.isArray(ctx.days)) return [];
    const entries = [];
    (ctx.days || []).forEach((day, dayIndex) => {
      (day.rows || []).forEach((row, rowIndex) => {
        const target = window.VGRSite && window.VGRSite.parseScheduleDateTime
          ? window.VGRSite.parseScheduleDateTime(day.date, row.time)
          : null;
        if (!target) return;
        entries.push({ day, row, dayIndex, rowIndex, target });
      });
    });
    return entries;
  }

  function buildCalendar() {
    const ctx = getScheduleContext();
    const entries = scheduleEntries();
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//VGR 5 Badminton Cup 2026//ID',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    entries.forEach((entry) => {
      const end = new Date(entry.target.getTime() + 60 * 60 * 1000);
      lines.push(
        'BEGIN:VEVENT',
        `UID:vgr5-${entry.dayIndex}-${entry.rowIndex}-${entry.target.getTime()}@vgr5arena.my.id`,
        `DTSTAMP:${formatIcsDate(new Date())}`,
        `DTSTART:${formatIcsDate(entry.target)}`,
        `DTEND:${formatIcsDate(end)}`,
        `SUMMARY:${escapeIcs(`${ctx.title || APP_NAME}: ${entry.row.a} vs ${entry.row.b}`)}`,
        `DESCRIPTION:${escapeIcs(`${entry.day.date} ${entry.row.time}`)}`,
        'END:VEVENT',
      );
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  function setInstallButtonsVisible(visible) {
    document.querySelectorAll(INSTALL_SELECTOR).forEach((button) => {
      button.hidden = !visible;
    });
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch (err) {
      // Offline mode is best-effort; keep the UI usable if registration fails.
    }
  }

  async function promptInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    try {
      await installPrompt.userChoice;
    } finally {
      installPrompt = null;
      setInstallButtonsVisible(false);
    }
  }

  function saveCalendar() {
    const ctx = getScheduleContext();
    if (!ctx) return;
    const ics = buildCalendar();
    const cleanTitle = String(ctx.title || APP_NAME).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'jadwal';
    downloadText(`${cleanTitle}.ics`, ics);
  }

  async function notifyNow(title, body) {
    if (!('Notification' in window)) return false;
    if (Notification.permission !== 'granted') return false;

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body,
          icon: ICON,
          badge: ICON,
          tag: 'vgr5-reminder',
          renotify: true,
        });
      } else {
        new Notification(title, { body, icon: ICON });
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  function clearStoredReminder() {
    localStorage.removeItem(REMINDER_KEY);
    if (reminderTimer) {
      clearTimeout(reminderTimer);
      reminderTimer = null;
    }
  }

  async function fireReminder(entry) {
    const title = 'Pertandingan segera dimulai';
    const body = `${entry.row.a} vs ${entry.row.b} - ${entry.day.date} ${entry.row.time}`;
    const shown = await notifyNow(title, body);
    if (shown) {
      clearStoredReminder();
    }
  }

  function armReminder(entry) {
    if (!entry || !entry.targetISO) return;
    const targetTime = new Date(entry.targetISO).getTime();
    if (Number.isNaN(targetTime)) return;

    if (reminderTimer) {
      clearTimeout(reminderTimer);
      reminderTimer = null;
    }

    const delay = targetTime - Date.now();
    if (delay <= 0) {
      fireReminder(entry);
      return;
    }

    reminderTimer = window.setTimeout(() => {
      fireReminder(entry);
    }, Math.min(delay, 2147483647));
  }

  async function requestReminder() {
    const ctx = getScheduleContext();
    if (!ctx || !ctx.nextMatch) return;

    if (!('Notification' in window)) {
      alert('Notifikasi belum didukung di browser ini.');
      return;
    }

    const permission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();

    if (permission !== 'granted') {
      alert('Izinkan notifikasi dulu supaya pengingat bisa aktif.');
      return;
    }

    const entry = {
      title: ctx.title || APP_NAME,
      day: ctx.nextMatch.date,
      time: ctx.nextMatch.time,
      a: ctx.nextMatch.a,
      b: ctx.nextMatch.b,
      targetISO: ctx.nextMatch.targetISO,
    };

    localStorage.setItem(REMINDER_KEY, JSON.stringify(entry));
    armReminder(entry);
    await notifyNow('Pengingat aktif', `${entry.a} vs ${entry.b} akan dipantau sampai mulai.`);
  }

  function hydrateReminder() {
    try {
      const raw = localStorage.getItem(REMINDER_KEY);
      if (!raw) return;
      const entry = JSON.parse(raw);
      armReminder(entry);
    } catch (err) {
      clearStoredReminder();
    }
  }

  function updateCountdowns() {
    document.querySelectorAll(COUNTDOWN_SELECTOR).forEach((timer) => {
      const target = new Date(timer.dataset.countdownTarget);
      const value = timer.querySelector('.countdown-value');
      if (!value || Number.isNaN(target.getTime()) || !window.VGRSite || !window.VGRSite.formatCountdown) return;
      value.textContent = window.VGRSite.formatCountdown(target.getTime() - Date.now());
    });
  }

  document.addEventListener('click', (event) => {
    const install = event.target.closest(INSTALL_SELECTOR);
    if (install) {
      event.preventDefault();
      promptInstall();
      return;
    }

    const save = event.target.closest(SAVE_SELECTOR);
    if (save) {
      event.preventDefault();
      saveCalendar();
      return;
    }

    const remind = event.target.closest(REMIND_SELECTOR);
    if (remind) {
      event.preventDefault();
      requestReminder();
    }
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    setInstallButtonsVisible(true);
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    setInstallButtonsVisible(false);
  });

  window.addEventListener('load', () => {
    registerServiceWorker();
    hydrateReminder();
    updateCountdowns();
    setInterval(updateCountdowns, 1000);

    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setInstallButtonsVisible(false);
    }
  });

  window.VGRPWA = {
    promptInstall,
    saveCalendar,
    requestReminder,
    hydrateReminder,
  };
})();
