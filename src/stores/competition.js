import { defineStore } from 'pinia';
import { loadSnapshot, readCachedSnapshot } from '../services/snapshot.js';
import { selectItem } from '../utils/competition.js';

const initialSnapshot = readCachedSnapshot();

export const useCompetitionStore = defineStore('competition', {
  state: () => ({
    snapshot: initialSnapshot,
    loading: !initialSnapshot,
    refreshing: false,
    error: null,
    lastUpdatedAt: null,
  }),

  getters: {
    items: (state) => (Array.isArray(state.snapshot?.items) ? state.snapshot.items : []),
    source: (state) => state.snapshot?.source || '',
    getItemByCat: (state) => (category) => selectItem(state.snapshot, category),
  },

  actions: {
    async init() {
      if (this.snapshot) {
        this.loading = false;
        void this.refresh();
        return this.snapshot;
      }

      this.loading = true;
      try {
        const payload = await loadSnapshot();
        this.snapshot = payload;
        this.lastUpdatedAt = Date.now();
        this.error = null;
        return payload;
      } catch (error) {
        this.error = error;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async refresh() {
      this.refreshing = true;
      try {
        const payload = await loadSnapshot({ forceRefresh: true });
        this.snapshot = payload;
        this.lastUpdatedAt = Date.now();
        this.error = null;
        return payload;
      } catch (error) {
        this.error = error;
        return this.snapshot;
      } finally {
        this.refreshing = false;
      }
    },
  },
});
