<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '../components/AppShell.vue';
import MatchCard from '../components/MatchCard.vue';
import { usePwaActions } from '../composables/usePwaActions.js';
import { useCompetitionStore } from '../stores/competition.js';
import { buildCategoryTabs, findNextScheduleEntry, formatCountdown, formatMatchScore, getPageCopy, iconSvg, parseCategory } from '../utils/competition.js';

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
const pwa = usePwaActions(() => null);

const mobileHomeSlides = computed(() => [
  {
    key: 'next',
    label: 'Pertandingan berikutnya',
    title: nextMatchLabel.value,
    description: nextMatch.value ? `${nextMatch.value.day.date} - ${nextMatch.value.row.time}` : 'Jadwal belum tersedia',
    meta: nextCountdown.value,
    badge: 'Jadwal',
    variant: 'next',
    to: { name: 'schedule', query: { cat: String(activeCat.value) } },
    cta: 'Lihat jadwal',
  },
  {
    key: 'score',
    label: 'Skor terakhir',
    title: latestSummary.value?.a || 'Belum ada skor',
    description: latestSummary.value ? `${latestSummary.value.left} vs ${latestSummary.value.right}` : 'Tunggu hasil terbaru masuk',
    meta: latestSummary.value?.b || 'Hasil terbaru',
    badge: latestSummary.value?.status || 'FT',
    variant: 'score',
    to: { name: 'results', query: { cat: String(activeCat.value) } },
    cta: 'Detail hasil',
  },
  {
    key: 'group',
    label: 'Ringkasan klasemen',
    title: featuredGroup.value?.group || 'Klasemen',
    description: featuredGroup.value?.rows?.[0]?.team || 'Belum ada data grup',
    meta: featuredGroup.value?.rows?.[0]?.form || 'Form belum tersedia',
    badge: `Grup ${totalGroups.value}`,
    variant: 'group',
    to: { name: 'groups', query: { cat: String(activeCat.value) } },
    cta: 'Lihat grup',
  },
]);

const carouselRef = ref(null);
const activeSlide = ref(0);
let carouselTimer = null;

function scrollToSlide(index, behavior = 'smooth') {
  const el = carouselRef.value;
  const slideCount = mobileHomeSlides.value.length;
  if (!el || !slideCount) return;
  const nextIndex = ((index % slideCount) + slideCount) % slideCount;
  const width = el.clientWidth || 1;
  el.scrollTo({ left: nextIndex * width, behavior });
  activeSlide.value = nextIndex;
}

function syncSlideFromScroll() {
  const el = carouselRef.value;
  if (!el) return;
  const width = el.clientWidth || 1;
  const index = Math.round(el.scrollLeft / width);
  activeSlide.value = Math.max(0, Math.min(index, mobileHomeSlides.value.length - 1));
}

onMounted(() => {
  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion) {
    carouselTimer = window.setInterval(() => {
      scrollToSlide(activeSlide.value + 1);
    }, 5500);
  }
});

onBeforeUnmount(() => {
  if (carouselTimer) {
    window.clearInterval(carouselTimer);
  }
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
        <div class="mobile-home-carousel-shell">
          <div
            ref="carouselRef"
            class="mobile-home-carousel"
            @scroll.passive="syncSlideFromScroll"
          >
            <article
              v-for="slide in mobileHomeSlides"
              :key="slide.key"
              class="mobile-home-card mobile-home-panel"
              :class="`mobile-home-${slide.variant}`"
            >
              <div class="mobile-home-card-label">{{ slide.label }}</div>
              <div class="mobile-home-panel-body">
                <strong>{{ slide.title }}</strong>
                <span>{{ slide.description }}</span>
                <small>{{ slide.meta }}</small>
              </div>
              <div class="mobile-home-card-foot">
                <span class="mobile-home-pill">{{ slide.badge }}</span>
                <RouterLink class="mobile-home-link" :to="slide.to">{{ slide.cta }}</RouterLink>
              </div>
            </article>
          </div>
          <div class="mobile-home-dots" aria-label="Navigasi carousel">
            <button
              v-for="(slide, index) in mobileHomeSlides"
              :key="slide.key + '-dot'"
              class="mobile-home-dot"
              :class="{ active: activeSlide === index }"
              type="button"
              :aria-label="`Lihat ${slide.label}`"
              @click="scrollToSlide(index)"
            />
          </div>
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
