import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Quasar } from 'quasar';
import 'quasar/dist/quasar.css';
import '@quasar/extras/material-icons/material-icons.css';
import { router } from './router/index.js';
import App from './App.vue';
import './styles/main.css';
import { getCategorySlug, parseCategory } from './utils/competition.js';

function migrateLegacyHashRoute() {
  if (typeof window === 'undefined') return;

  const redirect = new URLSearchParams(window.location.search).get('redirect');
  if (redirect) {
    window.history.replaceState({}, '', redirect);
    return;
  }

  const hash = window.location.hash || '';
  if (!hash.startsWith('#/')) return;

  const [rawPath, rawQuery = ''] = hash.slice(2).split('?');
  const page = rawPath.split('/').filter(Boolean)[0];
  if (!['results', 'schedule', 'groups'].includes(page)) return;

  const params = new URLSearchParams(rawQuery);
  const categorySlug = getCategorySlug(parseCategory(params.get('cat')));
  window.history.replaceState(
    {},
    '',
    `/${page}/${categorySlug}`
  );
}

const app = createApp(App);

app.use(createPinia());
app.use(Quasar, {
  config: {
    brand: {
      primary: '#d61f63',
      secondary: '#1a2235',
      accent: '#f4c95f',
      positive: '#17a673',
      negative: '#e53e3e',
      info: '#1976d2',
      warning: '#f4c95f',
    },
  },
});
app.use(router);

migrateLegacyHashRoute();

router.isReady().then(() => {
  app.mount('#app');
});
