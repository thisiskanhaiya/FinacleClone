import { createApp } from 'vue';
import App from './app/App.vue';
import { pinia } from './stores/index.js';
import { router } from './router/index.js';
import { seedService } from './services/seedService.js';
import './assets/styles/main.css';

async function bootstrap() {
  // Load fictional seed data into localStorage on first boot (idempotent).
  await seedService.ensureSeeded();

  const app = createApp(App);
  app.use(pinia);
  app.use(router);
  app.mount('#app');
}

bootstrap();
