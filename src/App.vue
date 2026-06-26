<script setup>
import { onBeforeUnmount, onMounted, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { APP_NAME } from './utils/competition.js';
import { useCompetitionStore } from './stores/competition.js';

const route = useRoute();
const store = useCompetitionStore();
let refreshTimer = null;

onMounted(async () => {
  await store.init();
  refreshTimer = window.setInterval(() => {
    store.refresh();
  }, 15000);
});

onBeforeUnmount(() => {
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
  <RouterView />
</template>
