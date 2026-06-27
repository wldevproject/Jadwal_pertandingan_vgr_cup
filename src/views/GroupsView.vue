<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '../components/AppShell.vue';
import GroupCard from '../components/GroupCard.vue';
import { usePwaActions } from '../composables/usePwaActions.js';
import { useCompetitionStore } from '../stores/competition.js';
import { buildCategoryTabs, getPageCopy, iconSvg, parseCategory } from '../utils/competition.js';

const store = useCompetitionStore();
const route = useRoute();
const page = 'groups';
const pageCopy = getPageCopy(page);

const activeCat = computed(() => parseCategory(route.params.categorySlug ?? route.query.cat));
const tabs = computed(() => buildCategoryTabs(page, activeCat.value));
const currentCat = computed(() => store.getItemByCat(activeCat.value));
const groups = computed(() => Array.isArray(currentCat.value.groups) ? currentCat.value.groups : []);
const pwa = usePwaActions(() => null);
</script>

<template>
  <AppShell
    :page="page"
    :active-cat="activeCat"
    :eyebrow="pageCopy.eyebrow"
    :title="pageCopy.title"
    :subtitle="pageCopy.subtitle"
    :status="pageCopy.status"
    :tabs="tabs"
    :loading="store.loading"
    :note="pageCopy.note"
  >
    <template #statusActions>
      <button
        v-if="pwa.installAvailable"
        class="action-btn action-btn-icon primary"
        data-install-pwa
        type="button"
        aria-label="Pasang aplikasi"
        title="Pasang aplikasi"
        @click="pwa.promptInstall"
      >
        <span class="action-btn-icon-mark" v-html="iconSvg('install')" />
      </button>
    </template>

    <template #lead>
      <section v-if="store.loading" class="lead lead-schedule" aria-label="memuat klasemen">
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
      <section v-else class="lead lead-schedule" aria-label="ringkasan klasemen">
        <div class="lead-head">
          <div class="lead-title">Ringkasan Grup</div>
          <div class="lead-tag">Aktif</div>
        </div>
        <div class="lead-grid">
          <div class="lead-list">
            <div class="lead-row"><div class="lead-team">{{ groups.length }} grup</div><div class="lead-time">aktif</div></div>
            <div class="lead-row"><div class="lead-team">2 teratas lolos</div><div class="lead-time">tiap grup</div></div>
          </div>
          <div class="lead-meta"><strong>{{ groups.length * 2 }}</strong><span>posisi</span></div>
        </div>
      </section>
    </template>

    <section class="section">
      <div class="section-head">
        <div>
          <h2>Klasemen</h2>
          <p>Posisi tiap grup dan urutan tim.</p>
        </div>
        <div class="chip">Fase Grup</div>
      </div>
      <div class="groups-grid">
        <GroupCard v-for="group in groups" :key="group.group" :group="group" />
      </div>
      <div class="legend">
        <span>2 teratas lolos</span>
        <span>Tampilan ringkas</span>
        <span>Satu tema</span>
      </div>
    </section>
  </AppShell>
</template>
