<script setup>
import { computed } from 'vue';
import { buildMobileNav, iconSvg } from '../utils/competition.js';

const props = defineProps({
  page: { type: String, required: true },
  activeCat: { type: Number, default: 16 },
  eyebrow: { type: String, default: '' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  status: { type: String, default: 'Aktif' },
  tabs: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  note: { type: String, default: '' },
});

const mobileNavItems = computed(() => buildMobileNav(props.page, props.activeCat));
</script>

<template>
  <div class="wrap" :class="{ 'loading-state': loading }">
    <header class="top">
      <div class="header-top">
        <div>
          <div class="eyebrow">{{ eyebrow }}</div>
          <h1>{{ title }}</h1>
        </div>
      </div>
      <p class="sub">{{ subtitle }}</p>
      <div class="status-row">
        <div class="status">{{ loading ? 'Memuat' : status }}</div>
        <div v-if="$slots.statusActions" class="status-actions">
          <slot name="statusActions" />
        </div>
      </div>
      <nav v-if="tabs.length" class="tabs" aria-label="Kategori">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.to.name + ':' + tab.to.query.cat"
          :to="tab.to"
          :class="{ active: tab.active }"
        >
          <span class="tab-full">{{ tab.label }}</span>
          <span class="tab-short">{{ tab.shortLabel || tab.label }}</span>
        </RouterLink>
      </nav>
    </header>

    <slot name="lead" />

    <main class="shell-grid">
      <slot />
    </main>

    <div v-if="note" class="page-note">{{ note }}</div>

    <nav class="mobile-nav" aria-label="Navigasi halaman">
      <RouterLink
        v-for="item in mobileNavItems"
        :key="item.to.name"
        class="mobile-nav-item"
        :class="{ active: item.active }"
        :to="item.to"
      >
        <span class="mobile-nav-icon" v-html="iconSvg(item.icon)" />
        <span class="mobile-nav-label">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>
