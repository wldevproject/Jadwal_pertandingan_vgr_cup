import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { router } from './router/index.js';
import App from './App.vue';
import './styles/main.css';
import { registerSW } from 'virtual:pwa-register';

const app = createApp(App);

app.use(createPinia());
app.use(router);

router.isReady().then(() => {
  app.mount('#app');
});

registerSW({ immediate: true });
