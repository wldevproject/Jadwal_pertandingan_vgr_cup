window.VGRSite = window.VGRSite || {};
window.VGRSite.payloadCacheKey = 'vgr5cup2026.payload';

window.VGRSite.readCachedPayload = function readCachedPayload() {
  try {
    const raw = localStorage.getItem(window.VGRSite.payloadCacheKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
};

window.VGRSite.writeCachedPayload = function writeCachedPayload(payload) {
  try {
    localStorage.setItem(window.VGRSite.payloadCacheKey, JSON.stringify(payload));
  } catch (err) {
    // Ignore storage quota or privacy mode failures.
  }
};

window.VGRSite.getPayload = async function getPayload() {
  if (window.VGRScrapedResults) {
    window.VGRSite.writeCachedPayload(window.VGRScrapedResults);
    return window.VGRScrapedResults;
  }

  const cached = window.VGRSite.readCachedPayload();
  if (cached) {
    return cached;
  }

  const res = await fetch('./scraped-results.json', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to load scraped-results.json');
  }

  const payload = await res.json();
  window.VGRSite.writeCachedPayload(payload);
  return payload;
};

window.VGRSite.reloadSnapshot = function reloadSnapshot() {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('vgr-scraped-results');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id = 'vgr-scraped-results';
    script.src = `./scraped-results.js?v=${Date.now()}`;
    script.onload = () => resolve(window.VGRScrapedResults);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

window.VGRSite.startAutoRefresh = function startAutoRefresh(render, intervalMs = 15000) {
  if (window.__vgrAutoRefreshStarted) return;
  window.__vgrAutoRefreshStarted = true;

  window.setInterval(async () => {
    try {
      await window.VGRSite.reloadSnapshot();
      const payload = await window.VGRSite.getPayload();
      window.VGRSite.writeCachedPayload(payload);
      render(payload);
    } catch (err) {
      // Keep the last rendered snapshot if live refresh fails.
    }
  }, intervalMs);
};

window.VGRSite.formatMatchScore = function formatMatchScore(row) {
  const rawScore = (row && row.score ? String(row.score) : '').trim();
  const hasWo = rawScore === 'WO' || Boolean(row && row.meta);

  if (rawScore === 'WO') {
    return { left: 'WO', right: 'WO', status: 'WO' };
  }

  const parts = rawScore.split('-').map((part) => part.trim()).filter(Boolean);
  return {
    left: parts[0] || '0',
    right: parts[1] || '0',
    status: hasWo ? 'WO' : 'FT',
  };
};

window.VGRSite.parseScheduleDateTime = function parseScheduleDateTime(dateText, timeText) {
  const match = String(dateText || '').match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!match) return null;

  const monthMap = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    mei: 4,
    may: 4,
    jun: 5,
    jul: 6,
    agu: 7,
    agt: 7,
    aug: 7,
    sep: 8,
    okt: 9,
    oct: 9,
    nov: 10,
    des: 11,
    dec: 11,
  };

  const day = Number(match[1]);
  const monthKey = match[2].slice(0, 3).toLowerCase();
  const month = monthMap[monthKey];
  const year = Number(match[3]);
  if (month == null) return null;

  const timeMatch = String(timeText || '').match(/(\d{1,2}):(\d{2})/);
  const hour = timeMatch ? Number(timeMatch[1]) : 0;
  const minute = timeMatch ? Number(timeMatch[2]) : 0;

  return new Date(Date.UTC(year, month, day, hour - 7, minute, 0));
};

window.VGRSite.findNextScheduleEntry = function findNextScheduleEntry(days, now = new Date()) {
  const entries = [];
  (days || []).forEach((day) => {
    (day.rows || []).forEach((row) => {
      const target = window.VGRSite.parseScheduleDateTime(day.date, row.time);
      if (target) {
        entries.push({ day, row, target });
      }
    });
  });

  if (!entries.length) return null;

  const upcoming = entries
    .filter((entry) => entry.target.getTime() >= now.getTime())
    .sort((a, b) => a.target - b.target)[0];

  return upcoming || entries.sort((a, b) => a.target - b.target)[0];
};

window.VGRSite.formatCountdown = function formatCountdown(diffMs) {
  const total = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n) => String(n).padStart(2, '0');

  if (days > 0) return `${days}h ${pad(hours)}m`;
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
};

window.VGRSite.iconSvg = function iconSvg(name) {
  if (name === 'calendar') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.5A1.5 1.5 0 0 1 21 5.5v13A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-13A1.5 1.5 0 0 1 4.5 4H6V3a1 1 0 0 1 1-1Zm12 7H5v9.5h14V9Z"/></svg>';
  }
  if (name === 'chart') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19.5A1.5 1.5 0 0 1 3.5 18V6A1.5 1.5 0 0 1 5 4.5h14A1.5 1.5 0 0 1 20.5 6v12A1.5 1.5 0 0 1 19 19.5H5Zm1-3h2.5V10H6v6.5Zm5 0h2.5V7H11v9.5Zm5 0h2.5V13H16v3.5Z"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3.5 7.5V19h5v-6h7v6h5V7.5L12 3Zm0 2.3 6.5 3.4V17h-3v-6H8.5v6h-3V8.7L12 5.3Z"/></svg>';
};

window.VGRSite.shell = function shell(config) {
  const nav = [
    { href: './result-panel.html', label: 'Hasil', active: config.page === 'results', icon: 'score' },
    { href: './schedule.html', label: 'Jadwal', active: config.page === 'schedule', icon: 'calendar' },
    { href: './groups.html', label: 'Klasemen', active: config.page === 'groups', icon: 'chart' },
  ];

  const tabs = config.tabs || [];
  return `
    <div class="wrap ${config.loading ? 'loading-state' : ''}">
      <header class="top">
        <div>
          <div class="eyebrow">${config.eyebrow || 'Halaman Turnamen'}</div>
          <h1>${config.title || ''}</h1>
        </div>
        <p class="sub">${config.subtitle || ''}</p>
        <div class="status-row">
          <div class="status">${config.status || 'Aktif'}</div>
        </div>
        ${config.actions ? `<div class="action-row">${config.actions}</div>` : ''}
        ${tabs.length ? `<nav class="tabs" aria-label="Kategori">${tabs.map((tab) => `<a class="${tab.active ? 'active' : ''}" href="${tab.href}"><span class="tab-full">${tab.label}</span><span class="tab-short">${tab.shortLabel || tab.label}</span></a>`).join('')}</nav>` : ''}
      </header>
      ${config.lead || ''}
      <main class="shell-grid">
        ${config.main || ''}
      </main>
      ${config.note ? `<div class="page-note">${config.note}</div>` : ''}
      <nav class="mobile-nav" aria-label="Navigasi halaman">
        ${nav.map((item) => `
          <a class="mobile-nav-item ${item.active ? 'active' : ''}" href="${item.href}">
            <span class="mobile-nav-icon">${window.VGRSite.iconSvg(item.icon)}</span>
            <span class="mobile-nav-label">${item.label}</span>
          </a>
        `).join('')}
      </nav>
    </div>
  `;
};

window.VGRSite.loadingShell = function loadingShell(config = {}) {
  const kind = config.kind || 'results';
  let lead = '';
  let main = '';

  if (kind === 'schedule') {
    lead = `
      <section class="lead lead-schedule" aria-label="memuat jadwal">
        <div class="lead-head">
          <div class="lead-title shimmer-line shimmer-w-180"></div>
          <div class="lead-tag shimmer-line shimmer-w-72"></div>
        </div>
        <div class="schedule-list">
          <div class="schedule-row">
            <div class="schedule-time shimmer-line shimmer-w-72"></div>
            <div class="schedule-match">
              <div class="schedule-team shimmer-line shimmer-w-120"></div>
              <div class="schedule-vs shimmer-line shimmer-w-28"></div>
              <div class="schedule-team shimmer-line shimmer-w-120"></div>
            </div>
          </div>
          <div class="schedule-row">
            <div class="schedule-time shimmer-line shimmer-w-72"></div>
            <div class="schedule-match">
              <div class="schedule-team shimmer-line shimmer-w-120"></div>
              <div class="schedule-vs shimmer-line shimmer-w-28"></div>
              <div class="schedule-team shimmer-line shimmer-w-120"></div>
            </div>
          </div>
        </div>
      </section>
    `;
    main = `
      <section class="section">
        <div class="section-head">
          <div>
            <div class="skeleton-line shimmer-line shimmer-w-120"></div>
            <div class="skeleton-line shimmer-line shimmer-w-220"></div>
          </div>
          <div class="chip skeleton-pill shimmer-line shimmer-w-72"></div>
        </div>
        <div class="days">
          <article class="day">
            <div class="day-head">
              <div class="date skeleton-line shimmer-line shimmer-w-160"></div>
              <div class="day-chip skeleton-pill shimmer-line shimmer-w-64"></div>
            </div>
            <div class="rows">
              <div class="row">
                <div class="row-time"><div class="time skeleton-line shimmer-line shimmer-w-64"></div></div>
                <div class="row-match">
                  <div class="team team-left skeleton-line shimmer-line shimmer-w-120"></div>
                  <div class="vs skeleton-line shimmer-line shimmer-w-24"></div>
                  <div class="team team-right skeleton-line shimmer-line shimmer-w-120"></div>
                </div>
              </div>
              <div class="row">
                <div class="row-time"><div class="time skeleton-line shimmer-line shimmer-w-64"></div></div>
                <div class="row-match">
                  <div class="team team-left skeleton-line shimmer-line shimmer-w-120"></div>
                  <div class="vs skeleton-line shimmer-line shimmer-w-24"></div>
                  <div class="team team-right skeleton-line shimmer-line shimmer-w-120"></div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    `;
  } else if (kind === 'groups') {
    lead = `
      <section class="lead lead-schedule" aria-label="memuat klasemen">
        <div class="lead-head">
          <div class="lead-title shimmer-line shimmer-w-160"></div>
          <div class="lead-tag shimmer-line shimmer-w-72"></div>
        </div>
        <div class="lead-grid">
          <div class="lead-list">
            <div class="lead-row"><div class="lead-team shimmer-line shimmer-w-140"></div><div class="lead-time shimmer-line shimmer-w-72"></div></div>
            <div class="lead-row"><div class="lead-team shimmer-line shimmer-w-140"></div><div class="lead-time shimmer-line shimmer-w-72"></div></div>
          </div>
          <div class="lead-meta">
            <strong class="skeleton-line shimmer-line shimmer-w-40"></strong>
            <span class="skeleton-line shimmer-line shimmer-w-64"></span>
          </div>
        </div>
      </section>
    `;
    main = `
      <section class="section">
        <div class="section-head">
          <div>
            <div class="skeleton-line shimmer-line shimmer-w-120"></div>
            <div class="skeleton-line shimmer-line shimmer-w-220"></div>
          </div>
          <div class="chip skeleton-pill shimmer-line shimmer-w-72"></div>
        </div>
        <div class="groups-grid">
          <article class="group-card">
            <div class="group-head">
              <div class="group-name skeleton-line shimmer-line shimmer-w-120"></div>
              <div class="group-pill skeleton-pill shimmer-line shimmer-w-120"></div>
            </div>
            <div class="skeleton-table">
              <div class="skeleton-row"></div>
              <div class="skeleton-row"></div>
              <div class="skeleton-row"></div>
            </div>
          </article>
        </div>
      </section>
    `;
  } else {
    lead = `
      <section class="lead" aria-label="memuat hasil">
        <div class="lead-head">
          <div class="lead-title shimmer-line shimmer-w-160"></div>
          <div class="lead-tag shimmer-line shimmer-w-72"></div>
        </div>
        <div class="lead-grid">
          <div class="lead-list">
            <div class="lead-row"><div class="lead-team shimmer-line shimmer-w-140"></div><div class="lead-time shimmer-line shimmer-w-72"></div></div>
            <div class="lead-row"><div class="lead-team shimmer-line shimmer-w-140"></div><div class="lead-time shimmer-line shimmer-w-72"></div></div>
          </div>
          <div class="lead-meta">
            <strong class="skeleton-line shimmer-line shimmer-w-40"></strong>
            <span class="skeleton-line shimmer-line shimmer-w-64"></span>
          </div>
        </div>
      </section>
    `;
    main = `
      <section class="section">
        <div class="section-head">
          <div>
            <div class="skeleton-line shimmer-line shimmer-w-120"></div>
            <div class="skeleton-line shimmer-line shimmer-w-220"></div>
          </div>
          <div class="chip skeleton-pill shimmer-line shimmer-w-72"></div>
        </div>
        <div class="card-grid">
          <div class="match skeleton-match">
            <div class="teams">
              <div class="team-row"><div class="team-name skeleton-line shimmer-line shimmer-w-140"></div><div class="team-score skeleton-line shimmer-line shimmer-w-40"></div></div>
              <div class="team-row"><div class="team-name skeleton-line shimmer-line shimmer-w-140"></div><div class="team-score skeleton-line shimmer-line shimmer-w-40"></div></div>
            </div>
            <div class="divider"></div>
            <div class="meta">
              <strong class="skeleton-line shimmer-line shimmer-w-40"></strong>
              <span class="skeleton-line shimmer-line shimmer-w-64"></span>
            </div>
          </div>
          <div class="match skeleton-match">
            <div class="teams">
              <div class="team-row"><div class="team-name skeleton-line shimmer-line shimmer-w-140"></div><div class="team-score skeleton-line shimmer-line shimmer-w-40"></div></div>
              <div class="team-row"><div class="team-name skeleton-line shimmer-line shimmer-w-140"></div><div class="team-score skeleton-line shimmer-line shimmer-w-40"></div></div>
            </div>
            <div class="divider"></div>
            <div class="meta">
              <strong class="skeleton-line shimmer-line shimmer-w-40"></strong>
              <span class="skeleton-line shimmer-line shimmer-w-64"></span>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  return window.VGRSite.shell({
    eyebrow: config.eyebrow || 'Memuat Data',
    title: config.title || 'VGR 5 Badminton Cup 2026',
    subtitle: config.subtitle || 'Mohon tunggu sebentar, data sedang dimuat.',
    status: 'Memuat',
    tabs: config.tabs || [],
    actions: config.actions || '',
    lead,
    main,
    note: config.note || 'Memuat data terbaru.',
    loading: true,
  });
};

window.VGRSite.catTabHtml = function catTabHtml(activeCat, page = './result-panel.html') {
  return [
    { href: `${page}#cat-14`, label: 'Ganda Putri', shortLabel: 'Putri', active: activeCat === 14 },
    { href: `${page}#cat-15`, label: 'Ganda Campuran', shortLabel: 'Camp', active: activeCat === 15 },
    { href: `${page}#cat-16`, label: 'Ganda Putra', shortLabel: 'Putra', active: activeCat === 16 },
  ];
};

window.VGRSite.renderMatchCards = function renderMatchCards(cat) {
  return (cat.results || []).map((row) => {
    const score = window.VGRSite.formatMatchScore(row);
    const leftWinner = row.winner === 'a';
    const rightWinner = row.winner === 'b';
    return `
      <div class="match">
        <div class="teams">
          <div class="team-row ${leftWinner ? 'winner' : ''}">
            <div class="team-name">${row.a}</div>
            ${score.status === 'WO' && score.left === 'WO' ? '<div class="score-pill">WO</div>' : `<div class="team-score">${score.left}</div>`}
          </div>
          <div class="team-row ${rightWinner ? 'winner' : ''}">
            <div class="team-name">${row.b}</div>
            ${score.status === 'WO' && score.right === 'WO' ? '<div class="score-pill">WO</div>' : `<div class="team-score">${score.right}</div>`}
          </div>
        </div>
        <div class="divider" aria-hidden="true"></div>
        <div class="meta">
          <strong>${score.status}</strong>
          <span>Skor</span>
        </div>
      </div>`;
  }).join('');
};

window.VGRSite.renderMatches = function renderMatches(items) {
  return items.map((cat) => `
    <article class="section" aria-label="${cat.label || cat.category || `Kategori ${cat.cat || ''}`}">
      <div class="category-head">
        <div>
          <div class="category-title">${cat.label || cat.category || `Kategori ${cat.cat || ''}`}</div>
          <div class="category-note">Fase grup</div>
        </div>
        <div class="chip">${cat.results.length} match</div>
      </div>
      <div class="card-grid">
        ${window.VGRSite.renderMatchCards(cat)}
      </div>
    </article>
  `).join('');
};

window.VGRSite.renderSchedule = function renderSchedule(days) {
  return `
    <section class="section">
      <div class="section-head">
        <div>
          <h2>Jadwal</h2>
          <p>Urutan pertandingan yang akan dimainkan.</p>
        </div>
        <div class="chip">Fase Grup</div>
      </div>
      <div class="days">
        ${days.map((day) => `
          <article class="day">
            <div class="day-head">
              <div class="date">${day.date}</div>
              <div class="day-chip">Grup</div>
            </div>
            <div class="rows">
              ${day.rows.map((row) => `
                <div class="row">
                  <div class="row-time">
                    <div class="time">${row.time}</div>
                  </div>
                  <div class="row-match">
                    <div class="team team-left">${row.a}</div>
                    <div class="vs">vs</div>
                    <div class="team team-right">${row.b}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
};

window.VGRSite.renderGroups = function renderGroups(groups) {
  return `
    <section class="section">
      <div class="section-head">
        <div>
          <h2>Klasemen</h2>
          <p>Posisi tiap grup dan urutan tim.</p>
        </div>
        <div class="chip">Fase Grup</div>
      </div>
      <div class="groups-grid">
        ${groups.map((group) => `
          <article class="group-card">
            <div class="group-head">
              <div class="group-name">${group.group}</div>
              <div class="group-pill">2 teratas lolos</div>
            </div>
            <table>
              <thead>
                <tr><th>#</th><th>Team</th><th>Pts</th><th>W</th><th>L</th><th>PF-PA</th><th>Form</th></tr>
              </thead>
              <tbody>
                ${group.rows.map((row) => `
                  <tr class="${row.qualified ? 'qualified' : ''}">
                    <td class="rank">${row.rank}</td>
                    <td class="team">${row.team}</td>
                    <td class="pts">${row.pts}</td>
                    <td>${row.win}</td>
                    <td>${row.loss}</td>
                    <td>${row.pf_pa}</td>
                    <td class="form">${row.form}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </article>
        `).join('')}
      </div>
      <div class="legend">
        <span>2 teratas lolos</span>
        <span>Tampilan ringkas</span>
        <span>Satu tema</span>
      </div>
    </section>
  `;
};
