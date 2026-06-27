import { computed, onBeforeUnmount, onMounted, ref, unref } from 'vue';
import { APP_NAME } from '../utils/competition.js';
import { buildCalendar, downloadText } from '../services/calendar.js';

const REMINDER_KEY = 'vgr5cup2026.reminder';
let reminderTimer = null;

function readNotificationPermission() {
  return typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
}

async function notifyNow(title, body) {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission !== 'granted') return false;

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/app-icon.svg',
        badge: '/app-icon.svg',
        tag: 'vgr5-reminder',
        renotify: true,
      });
    } else {
      new Notification(title, { body, icon: '/app-icon.svg' });
    }

    return true;
  } catch (error) {
    return false;
  }
}

function clearStoredReminder() {
  if (typeof window === 'undefined') return;

  if (reminderTimer) {
    window.clearTimeout(reminderTimer);
    reminderTimer = null;
  }
}

function armReminder(entry) {
  if (!entry?.targetISO) return;

  const targetTime = new Date(entry.targetISO).getTime();
  if (Number.isNaN(targetTime)) return;

  if (reminderTimer) {
    window.clearTimeout(reminderTimer);
    reminderTimer = null;
  }

  const delay = targetTime - Date.now();
  if (delay <= 0) {
    void notifyNow('Pertandingan segera dimulai', `${entry.a} vs ${entry.b} - ${entry.day} ${entry.time}`);
    return;
  }

  reminderTimer = window.setTimeout(() => {
    void notifyNow('Pertandingan segera dimulai', `${entry.a} vs ${entry.b} - ${entry.day} ${entry.time}`);
  }, Math.min(delay, 2147483647));
}

function hydrateReminder() {
  if (typeof window === 'undefined') return;

  try {
    const raw = window.localStorage.getItem(REMINDER_KEY);
    if (!raw) return;
    const entry = JSON.parse(raw);
    armReminder(entry);
  } catch (error) {
    clearStoredReminder();
  }
}

function saveReminder(entry) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REMINDER_KEY, JSON.stringify(entry));
}

export function usePwaActions(contextSource) {
  const installPrompt = ref(null);
  const installAvailable = ref(false);
  const permission = ref(readNotificationPermission());
  let beforeInstallHandler = null;
  let appInstalledHandler = null;

  const scheduleContext = computed(() => {
    const current = typeof contextSource === 'function' ? contextSource() : unref(contextSource);
    return current || null;
  });

  function setInstallAvailable(visible) {
    installAvailable.value = visible;
  }

  async function promptInstall() {
    if (!installPrompt.value) return;

    installPrompt.value.prompt();
    try {
      await installPrompt.value.userChoice;
    } finally {
      installPrompt.value = null;
      setInstallAvailable(false);
    }
  }

  function saveCalendar() {
    const context = scheduleContext.value;
    if (!context) return;

    const ics = buildCalendar({
      title: context.title || APP_NAME,
      days: context.days || [],
    });
    const cleanTitle = String(context.title || APP_NAME)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'jadwal';

    downloadText(`${cleanTitle}.ics`, ics);
  }

  async function requestReminder() {
    const context = scheduleContext.value;
    if (!context?.nextMatch) return;

    if (typeof Notification === 'undefined') {
      window.alert('Notifikasi belum didukung di browser ini.');
      return;
    }

    const currentPermission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();

    permission.value = currentPermission;

    if (currentPermission !== 'granted') {
      window.alert('Izinkan notifikasi dulu supaya pengingat bisa aktif.');
      return;
    }

    const entry = {
      title: context.title || APP_NAME,
      day: context.nextMatch.date,
      time: context.nextMatch.time,
      a: context.nextMatch.a,
      b: context.nextMatch.b,
      targetISO: context.nextMatch.targetISO,
    };

    saveReminder(entry);
    armReminder(entry);
    await notifyNow('Pengingat aktif', `${entry.a} vs ${entry.b} akan dipantau sampai mulai.`);
  }

  onMounted(() => {
    beforeInstallHandler = (event) => {
      event.preventDefault();
      installPrompt.value = event;
      setInstallAvailable(true);
    };

    appInstalledHandler = () => {
      installPrompt.value = null;
      setInstallAvailable(false);
    };

    window.addEventListener('beforeinstallprompt', beforeInstallHandler);
    window.addEventListener('appinstalled', appInstalledHandler);

    hydrateReminder();
  });

  onBeforeUnmount(() => {
    if (beforeInstallHandler) {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
    }
    if (appInstalledHandler) {
      window.removeEventListener('appinstalled', appInstalledHandler);
    }
    clearStoredReminder();
  });

  return {
    installAvailable,
    permission,
    promptInstall,
    requestReminder,
    saveCalendar,
  };
}
