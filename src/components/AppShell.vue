<script setup>
import { computed } from 'vue';
import { buildMobileNav } from '../utils/competition.js';

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
  <QLayout view="hHh lpR fFf" class="app-layout" :class="{ 'loading-state': loading }">
    <div class="wrap app-wrap">
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
            :key="tab.to.name + ':' + (tab.to.params?.categorySlug || '')"
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
    </div>

    <QFooter v-if="mobileNavItems.length" bordered class="mobile-nav-shell">
      <nav class="mobile-nav" aria-label="Navigasi halaman">
        <RouterLink
          v-for="item in mobileNavItems"
          :key="item.to.name"
          class="mobile-nav-item"
          :class="{ active: item.active }"
          :to="item.to"
          :aria-current="item.active ? 'page' : undefined"
        >
          <QIcon :name="item.icon" class="mobile-nav-icon" />
          <span class="mobile-nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </QFooter>
  </QLayout>
</template>
