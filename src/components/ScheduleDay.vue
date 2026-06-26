<script setup>
defineProps({
  day: {
    type: Object,
    required: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <article class="day" :class="{ 'day-featured': featured }">
    <div class="day-head">
      <div class="date">{{ day.date }}</div>
      <div class="day-chip">Grup</div>
    </div>
    <div class="rows">
      <div v-for="(row, index) in day.rows" :key="day.date + '-' + row.time + '-' + index" class="row">
        <div class="row-time">
          <div class="time">{{ row.time }}</div>
        </div>
        <div class="row-match">
          <div class="team team-left">{{ row.a }}</div>
          <div class="vs">vs</div>
          <div class="team team-right">{{ row.b }}</div>
        </div>
      </div>
    </div>
  </article>
</template>
