<script setup>
defineProps({
  group: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <article class="group-card">
    <div class="group-head">
      <div class="group-name">{{ group.group }}</div>
      <div class="group-pill">2 teratas lolos</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Team</th>
          <th>Pts</th>
          <th>W</th>
          <th>L</th>
          <th>PF-PA</th>
          <th>Form</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in group.rows" :key="group.group + '-' + row.rank + '-' + row.team" :class="{ qualified: row.qualified }">
          <td class="rank">{{ row.rank }}</td>
          <td class="team">{{ row.team }}</td>
          <td class="pts">{{ row.pts }}</td>
          <td>{{ row.win }}</td>
          <td>{{ row.loss }}</td>
          <td>{{ row.pf_pa }}</td>
          <td class="form">{{ row.form }}</td>
        </tr>
      </tbody>
    </table>
  </article>
</template>
