import fallbackSnapshot from '../data/scraped-results.json';
import snapshotUrl from '../data/scraped-results.json?url';

const CACHE_KEY = 'vgr5cup2026.payload';

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readCachedSnapshot() {
  if (!hasStorage()) return null;

  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export function writeCachedSnapshot(payload) {
  if (!hasStorage()) return;

  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Ignore storage quota or privacy mode failures.
  }
}

async function fetchSnapshot() {
  const response = await fetch(snapshotUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load scraped-results.json');
  }

  return response.json();
}

export async function loadSnapshot({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = readCachedSnapshot();
    if (cached) {
      return cached;
    }
  }

  try {
    const payload = await fetchSnapshot();
    writeCachedSnapshot(payload);
    return payload;
  } catch (error) {
    const cached = readCachedSnapshot();
    if (cached) return cached;
    return fallbackSnapshot;
  }
}
