export const APP_NAME = 'VGR 5 Badminton Cup 2026';
export const DEFAULT_CATEGORY = 16;

const PAGE_COPY = {
  results: {
    eyebrow: 'Hasil Pertandingan',
    title: APP_NAME,
    subtitle: 'Halaman ini menampilkan skor pertandingan terbaru.',
    note: 'Halaman ini menampilkan skor pertandingan terbaru.',
    status: 'Aktif',
  },
  schedule: {
    eyebrow: 'Jadwal Pertandingan',
    title: APP_NAME,
    subtitle: 'Halaman ini menampilkan urutan pertandingan yang akan dimainkan.',
    note: 'Halaman ini menampilkan urutan pertandingan yang akan dimainkan.',
    status: 'Aktif',
  },
  groups: {
    eyebrow: 'Klasemen Grup',
    title: APP_NAME,
    subtitle: 'Halaman ini menampilkan posisi tiap grup dan urutan tim.',
    note: 'Halaman ini menampilkan posisi tiap grup dan urutan tim.',
    status: 'Aktif',
  },
};

const MONTH_MAP = {
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

export function getPageCopy(page) {
  return PAGE_COPY[page] || PAGE_COPY.results;
}

export function parseCategory(value) {
  const category = Number(value);
  return [14, 15, 16].includes(category) ? category : DEFAULT_CATEGORY;
}

export function getItems(payload) {
  return Array.isArray(payload?.items) ? payload.items : [];
}

export function selectItem(payload, category = DEFAULT_CATEGORY) {
  const items = getItems(payload);
  return items.find((item) => item.cat === category) || items[0] || {
    cat: category,
    category: 'Kategori',
    label: 'Kategori',
    results: [],
    schedule: [],
    groups: [],
  };
}

function categoryLabel(cat) {
  if (cat === 14) return 'Ganda Putri';
  if (cat === 15) return 'Ganda Campuran';
  return 'Ganda Putra';
}

function categoryShortLabel(cat) {
  if (cat === 14) return 'Putri';
  if (cat === 15) return 'Camp';
  return 'Putra';
}

export function buildCategoryTabs(page, activeCategory = DEFAULT_CATEGORY) {
  return [14, 15, 16].map((cat) => ({
    label: categoryLabel(cat),
    shortLabel: categoryShortLabel(cat),
    active: activeCategory === cat,
    to: {
      name: page,
      query: { cat: String(cat) },
    },
  }));
}

export function buildMobileNav(activePage, activeCategory = DEFAULT_CATEGORY) {
  return [
    { name: 'results', label: activePage === 'results' ? 'Beranda' : 'Hasil', active: activePage === 'results', icon: 'score' },
    { name: 'schedule', label: 'Jadwal', active: activePage === 'schedule', icon: 'calendar' },
    { name: 'groups', label: 'Klasemen', active: activePage === 'groups', icon: 'chart' },
  ].map((item) => ({
    ...item,
    to: {
      name: item.name,
      query: { cat: String(activeCategory) },
    },
  }));
}

export function formatMatchScore(row) {
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
}

export function parseScheduleDateTime(dateText, timeText) {
  const match = String(dateText || '').match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!match) return null;

  const day = Number(match[1]);
  const monthKey = match[2].slice(0, 3).toLowerCase();
  const month = MONTH_MAP[monthKey];
  const year = Number(match[3]);

  if (month == null) return null;

  const timeMatch = String(timeText || '').match(/(\d{1,2}):(\d{2})/);
  const hour = timeMatch ? Number(timeMatch[1]) : 0;
  const minute = timeMatch ? Number(timeMatch[2]) : 0;

  return new Date(Date.UTC(year, month, day, hour - 7, minute, 0));
}

export function findNextScheduleEntry(days, now = new Date()) {
  const entries = [];

  (days || []).forEach((day) => {
    (day.rows || []).forEach((row) => {
      const target = parseScheduleDateTime(day.date, row.time);
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
}

export function formatCountdown(diffMs) {
  const total = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n) => String(n).padStart(2, '0');

  if (days > 0) return `${days}h ${pad(hours)}m`;
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function iconSvg(name) {
  if (name === 'calendar') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.5A1.5 1.5 0 0 1 21 5.5v13A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-13A1.5 1.5 0 0 1 4.5 4H6V3a1 1 0 0 1 1-1Zm12 7H5v9.5h14V9Z"/></svg>';
  }

  if (name === 'chart') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19.5A1.5 1.5 0 0 1 3.5 18V6A1.5 1.5 0 0 1 5 4.5h14A1.5 1.5 0 0 1 20.5 6v12A1.5 1.5 0 0 1 19 19.5H5Zm1-3h2.5V10H6v6.5Zm5 0h2.5V7H11v9.5Zm5 0h2.5V13H16v3.5Z"/></svg>';
  }

  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3.5 7.5V19h5v-6h7v6h5V7.5L12 3Zm0 2.3 6.5 3.4V17h-3v-6H8.5v6h-3V8.7L12 5.3Z"/></svg>';
}
