<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { APP_NAME } from './utils/competition.js';
import { useCompetitionStore } from './stores/competition.js';
import { registerSW } from 'virtual:pwa-register';

const route = useRoute();
const store = useCompetitionStore();
let refreshTimer = null;
const updateAvailable = ref(false);
const offlineReady = ref(false);
const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);
const bannerDismissed = ref(
  typeof window !== 'undefined' && window.localStorage.getItem('vgr5cup2026.pwa.banner.dismissed') === '1',
);
let syncOnlineStatus = null;
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateAvailable.value = true;
  },
  onOfflineReady() {
    offlineReady.value = true;
  },
  onRegisterError(error) {
    console.error('PWA registration failed', error);
  },
});

const connectionLabel = computed(() => (isOnline.value ? 'Online' : 'Offline'));
const showPwaBanner = computed(() => (
  updateAvailable.value
  || !isOnline.value
  || (offlineReady.value && !bannerDismissed.value)
));

function reloadForUpdate() {
  updateAvailable.value = false;
  bannerDismissed.value = false;
  void updateSW(true);
}

function dismissBanner() {
  bannerDismissed.value = true;
  window.localStorage.setItem('vgr5cup2026.pwa.banner.dismissed', '1');
}

onMounted(async () => {
  syncOnlineStatus = () => {
    isOnline.value = navigator.onLine;
  };

  window.addEventListener('online', syncOnlineStatus);
  window.addEventListener('offline', syncOnlineStatus);

  await store.init();
  refreshTimer = window.setInterval(() => {
    store.refresh();
  }, 15000);
});

onBeforeUnmount(() => {
  if (syncOnlineStatus) {
    window.removeEventListener('online', syncOnlineStatus);
    window.removeEventListener('offline', syncOnlineStatus);
  }
  if (refreshTimer) {
    window.clearInterval(refreshTimer);
  }
});

watchEffect(() => {
  const pageTitle = route.meta?.title;
  document.title = pageTitle ? `${pageTitle} - ${APP_NAME}` : APP_NAME;
});
</script>

<template>
  <div v-if="showPwaBanner" class="pwa-banner" :class="{ offline: !isOnline, update: updateAvailable }">
    <div class="pwa-banner-copy">
      <strong v-if="updateAvailable">Versi baru siap</strong>
      <strong v-else-if="!isOnline">Mode offline aktif</strong>
      <strong v-else>App siap offline</strong>
      <span v-if="updateAvailable">Muat ulang untuk memakai versi terbaru.</span>
      <span v-else-if="!isOnline">Data tersimpan lokal tetap bisa dibuka.</span>
      <span v-else>Konten utama sudah disiapkan untuk akses tanpa jaringan.</span>
    </div>
    <div class="pwa-banner-actions">
      <span class="pwa-banner-pill">{{ connectionLabel }}</span>
      <button v-if="updateAvailable" class="action-btn primary" type="button" @click="reloadForUpdate">Muat Ulang</button>
      <button v-else-if="offlineReady" class="action-btn" type="button" @click="dismissBanner">Tutup</button>
    </div>
  </div>
  <RouterView />
</template>
