<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '../components/AppShell.vue';
import MatchCard from '../components/MatchCard.vue';
import { useCompetitionStore } from '../stores/competition.js';
import { buildCategoryTabs, formatMatchScore, getPageCopy, parseCategory } from '../utils/competition.js';

const store = useCompetitionStore();
const route = useRoute();
const page = 'results';
const pageCopy = getPageCopy(page);

const activeCat = computed(() => parseCategory(route.query.cat));
const tabs = computed(() => buildCategoryTabs(page, activeCat.value));
const currentCat = computed(() => store.getItemByCat(activeCat.value));
const currentMatches = computed(() => Array.isArray(currentCat.value.results) ? currentCat.value.results : []);
const leadMatch = computed(() => currentMatches.value[0] || null);
const leadScore = computed(() => (leadMatch.value ? formatMatchScore(leadMatch.value) : null));
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
    <template #actions>
      <button class="action-btn primary" data-install-pwa hidden>Pasang Aplikasi</button>
    </template>

    <template #lead>
      <section v-if="store.loading" class="lead" aria-label="memuat hasil">
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
      <section v-else-if="leadMatch" class="lead" aria-label="hasil terbaru">
        <div class="lead-head">
          <div class="lead-title">Skor Terakhir</div>
          <div class="lead-tag">{{ leadScore.status }}</div>
        </div>
        <div class="lead-grid">
          <div class="lead-list">
            <div class="lead-row"><div class="lead-team">{{ leadMatch.a }}</div><div class="lead-time">{{ leadScore.left }}</div></div>
            <div class="lead-row"><div class="lead-team">{{ leadMatch.b }}</div><div class="lead-time">{{ leadScore.right }}</div></div>
          </div>
          <div class="lead-meta">
            <strong>{{ leadScore.status }}</strong>
            <span>Skor akhir</span>
          </div>
        </div>
      </section>
    </template>

    <section class="section" :aria-label="currentCat.category || currentCat.label || 'Kategori'">
      <div class="section-head">
        <div>
          <h2>Hasil</h2>
          <p>Skor pertandingan terbaru dari setiap kategori.</p>
        </div>
        <div class="chip">{{ currentCat.category || 'Kategori' }}</div>
      </div>
      <div class="card-grid">
        <MatchCard v-for="row in currentMatches" :key="row.a + '-' + row.b" :match="row" />
      </div>
    </section>
  </AppShell>
</template>
