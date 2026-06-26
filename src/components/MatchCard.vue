<script setup>
import { computed } from 'vue';
import { formatMatchScore } from '../utils/competition.js';

const props = defineProps({
  match: {
    type: Object,
    required: true,
  },
});

const score = computed(() => formatMatchScore(props.match));
const leftWinner = computed(() => props.match.winner === 'a');
const rightWinner = computed(() => props.match.winner === 'b');
</script>

<template>
  <article class="match">
    <div class="teams">
      <div class="team-row" :class="{ winner: leftWinner }">
        <div class="team-name">{{ match.a }}</div>
        <div v-if="score.status === 'WO' && score.left === 'WO'" class="score-pill">WO</div>
        <div v-else class="team-score">{{ score.left }}</div>
      </div>
      <div class="team-row" :class="{ winner: rightWinner }">
        <div class="team-name">{{ match.b }}</div>
        <div v-if="score.status === 'WO' && score.right === 'WO'" class="score-pill">WO</div>
        <div v-else class="team-score">{{ score.right }}</div>
      </div>
    </div>
    <div class="divider" aria-hidden="true" />
    <div class="meta">
      <strong>{{ score.status }}</strong>
      <span>Skor</span>
    </div>
  </article>
</template>
