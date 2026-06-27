<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '../components/AppShell.vue';
import ScheduleDay from '../components/ScheduleDay.vue';
import { useCompetitionStore } from '../stores/competition.js';
import { buildCategoryTabs, findNextScheduleEntry, formatCountdown, getPageCopy, iconSvg, parseCategory } from '../utils/competition.js';
import { usePwaActions } from '../composables/usePwaActions.js';

const store = useCompetitionStore();
const route = useRoute();
const page = 'schedule';
const pageCopy = getPageCopy(page);

const activeCat = computed(() => parseCategory(route.params.categorySlug ?? route.query.cat));
const tabs = computed(() => buildCategoryTabs(page, activeCat.value));
const currentCat = computed(() => store.getItemByCat(activeCat.value));
const days = computed(() => Array.isArray(currentCat.value.schedule) ? currentCat.value.schedule : []);
const nextMatch = computed(() => findNextScheduleEntry(days.value));
const featuredDay = computed(() => (nextMatch.value ? nextMatch.value.day : null));
const currentTime = ref(Date.now());

const scheduleContext = computed(() => ({
  title: currentCat.value.category || currentCat.value.label || 'Jadwal',
  days: days.value,
  nextMatch: nextMatch.value ? {
    date: nextMatch.value.day.date,
    time: nextMatch.value.row.time,
    a: nextMatch.value.row.a,
    b: nextMatch.value.row.b,
    targetISO: nextMatch.value.target.toISOString(),
  } : null,
}));

const pwa = usePwaActions(scheduleContext);
let clockTimer = null;

const nextCountdown = computed(() => (
  nextMatch.value ? formatCountdown(nextMatch.value.target.getTime() - currentTime.value) : '--:--'
));

onMounted(() => {
  clockTimer = window.setInterval(() => {
    currentTime.value = Date.now();
  }, 1000);
});

onBeforeUnmount(() => {
  if (clockTimer) {
    window.clearInterval(clockTimer);
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
      <button
        class="action-btn action-btn-icon"
        data-save-calendar
        type="button"
        aria-label="Simpan jadwal"
        title="Simpan jadwal"
        @click="pwa.saveCalendar"
      >
        <span class="action-btn-icon-mark" v-html="iconSvg('download')" />
      </button>
      <button
        class="action-btn action-btn-icon"
        data-remind-next
        type="button"
        :disabled="!nextMatch"
        aria-label="Ingatkan pertandingan berikutnya"
        title="Ingatkan pertandingan berikutnya"
        @click="pwa.requestReminder"
      >
        <span class="action-btn-icon-mark" v-html="iconSvg('bell')" />
      </button>
    </template>

    <template #lead>
      <section v-if="store.loading" class="lead lead-schedule" aria-label="memuat jadwal">
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
      <section v-else-if="featuredDay" class="lead lead-schedule" aria-label="pertandingan berikutnya">
        <div class="lead-head">
          <div class="lead-title">Pertandingan Berikutnya</div>
          <div class="lead-tag" :data-countdown-target="nextMatch.target.toISOString()">
            <span class="countdown-value">{{ nextCountdown }}</span>
          </div>
        </div>
        <div class="schedule-list">
          <div v-for="(row, index) in featuredDay.rows" :key="row.time + '-' + row.a + '-' + row.b + '-' + index" class="schedule-row">
            <div class="schedule-time">{{ row.time }}</div>
            <div class="schedule-match">
              <div class="schedule-team schedule-left">{{ row.a }}</div>
              <div class="schedule-vs">vs</div>
              <div class="schedule-team schedule-right">{{ row.b }}</div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <section class="section">
      <div class="section-head">
        <div>
          <h2>Jadwal</h2>
          <p>Urutan pertandingan yang akan dimainkan.</p>
        </div>
        <div class="chip">Fase Grup</div>
      </div>
      <div class="days">
        <ScheduleDay
          v-for="day in days"
          :key="day.date"
          :day="day"
          :featured="featuredDay?.date === day.date"
        />
      </div>
    </section>
  </AppShell>
</template>
