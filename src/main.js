import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Quasar } from 'quasar';
import 'quasar/dist/quasar.css';
import '@quasar/extras/material-icons/material-icons.css';
import { router } from './router/index.js';
import App from './App.vue';
import './styles/main.css';

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

router.isReady().then(() => {
  app.mount('#app');
});
