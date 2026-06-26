<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '../components/AppShell.vue';
import MatchCard from '../components/MatchCard.vue';
import { useCompetitionStore } from '../stores/competition.js';
import { buildCategoryTabs, findNextScheduleEntry, formatCountdown, formatMatchScore, getPageCopy, parseCategory } from '../utils/competition.js';

const store = useCompetitionStore();
const route = useRoute();
const page = 'results';
const pageCopy = getPageCopy(page);

const activeCat = computed(() => parseCategory(route.query.cat));
const tabs = computed(() => buildCategoryTabs(page, activeCat.value));
const currentCat = computed(() => store.getItemByCat(activeCat.value));
const currentMatches = computed(() => Array.isArray(currentCat.value.results) ? currentCat.value.results : []);
const currentSchedule = computed(() => Array.isArray(currentCat.value.schedule) ? currentCat.value.schedule : []);
const leadMatch = computed(() => currentMatches.value[0] || null);
const leadScore = computed(() => (leadMatch.value ? formatMatchScore(leadMatch.value) : null));
const nextMatch = computed(() => findNextScheduleEntry(currentSchedule.value));
const latestSummary = computed(() => {
  if (!leadMatch.value || !leadScore.value) return null;
  return {
    a: leadMatch.value.a,
    b: leadMatch.value.b,
    left: leadScore.value.left,
    right: leadScore.value.right,
    status: leadScore.value.status,
  };
});
const totalGroups = computed(() => Array.isArray(currentCat.value.groups) ? currentCat.value.groups.length : 0);
const totalScheduleRows = computed(() => currentSchedule.value.reduce((total, day) => total + (Array.isArray(day.rows) ? day.rows.length : 0), 0));
const nextCountdown = computed(() => (nextMatch.value ? formatCountdown(nextMatch.value.target.getTime() - Date.now()) : '--:--'));
const nextMatchLabel = computed(() => (nextMatch.value ? `${nextMatch.value.row.a} vs ${nextMatch.value.row.b}` : 'Belum ada jadwal'));
const featuredGroup = computed(() => {
  const groups = Array.isArray(currentCat.value.groups) ? currentCat.value.groups : [];
  return groups[0] || null;
});
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
      <section v-if="store.loading" class="lead lead-home lead-mobile-home" aria-label="memuat beranda">
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
      <section v-else-if="leadMatch" class="lead lead-home lead-mobile-home" aria-label="beranda ringkas">
        <div class="lead-head mobile-home-head">
          <div>
            <div class="lead-title">Beranda</div>
            <div class="mobile-home-kicker">Ringkasan cepat turnamen</div>
          </div>
          <div class="lead-tag">{{ currentCat.category || 'Kategori' }}</div>
        </div>
        <div class="mobile-home-hero">
          <div class="mobile-home-hero-copy">
            <strong>{{ pageCopy.title }}</strong>
            <span>{{ pageCopy.subtitle }}</span>
          </div>
          <div class="mobile-home-badges">
            <span class="mobile-home-badge">Kategori {{ currentCat.cat }}</span>
            <span class="mobile-home-badge">Grup {{ totalGroups }}</span>
            <span class="mobile-home-badge">Jadwal {{ totalScheduleRows }}</span>
          </div>
        </div>
        <div class="mobile-home-grid">
          <article class="mobile-home-card mobile-home-next">
            <div class="mobile-home-card-label">Pertandingan berikutnya</div>
            <strong>{{ nextMatchLabel }}</strong>
            <span>{{ nextMatch ? nextMatch.day.date + ' - ' + nextMatch.row.time : 'Jadwal belum tersedia' }}</span>
            <div class="mobile-home-card-foot">
              <span class="mobile-home-pill">{{ nextCountdown }}</span>
              <RouterLink class="mobile-home-link" :to="{ name: 'schedule', query: { cat: String(activeCat) } }">Lihat jadwal</RouterLink>
            </div>
          </article>
          <article class="mobile-home-card mobile-home-score">
            <div class="mobile-home-card-label">Skor terakhir</div>
            <strong>{{ latestSummary?.a }}</strong>
            <span>{{ latestSummary?.left }} vs {{ latestSummary?.right }}</span>
            <small>{{ latestSummary?.b }}</small>
            <div class="mobile-home-card-foot">
              <span class="mobile-home-pill">{{ latestSummary?.status }}</span>
              <RouterLink class="mobile-home-link" :to="{ name: 'results', query: { cat: String(activeCat) } }">Detail hasil</RouterLink>
            </div>
          </article>
          <article class="mobile-home-card mobile-home-group" v-if="featuredGroup">
            <div class="mobile-home-card-label">Grup terdekat</div>
            <strong>{{ featuredGroup.group }}</strong>
            <span>{{ featuredGroup.rows?.[0]?.team }} unggulan</span>
            <small>{{ featuredGroup.rows?.[0]?.form || 'Form belum tersedia' }}</small>
            <div class="mobile-home-card-foot">
              <span class="mobile-home-pill">Klasemen</span>
              <RouterLink class="mobile-home-link" :to="{ name: 'groups', query: { cat: String(activeCat) } }">Lihat grup</RouterLink>
            </div>
          </article>
        </div>
      </section>
      <section v-else-if="leadMatch" class="lead lead-desktop-only" aria-label="hasil terbaru">
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

    <section class="section results-desktop-only" :aria-label="currentCat.category || currentCat.label || 'Kategori'">
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

    <section class="section results-mobile-only" :aria-label="currentCat.category || currentCat.label || 'Kategori'">
      <div class="section-head">
        <div>
          <h2>Hasil Lengkap</h2>
          <p>Daftar skor pertandingan terbaru.</p>
        </div>
        <div class="chip">{{ currentCat.category || 'Kategori' }}</div>
      </div>
      <div class="card-grid">
        <MatchCard v-for="row in currentMatches" :key="row.a + '-' + row.b" :match="row" />
      </div>
    </section>
  </AppShell>
</template>
