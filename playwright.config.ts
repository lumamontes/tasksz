import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;

/**
 * Browser regressions run against a production build in local-only mode:
 * Supabase and analytics variables are blanked so no test can reach a real
 * backend. The shared fixture also aborts every non-local request.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 } } },
  ],
  webServer: {
    command: `pnpm build && pnpm preview --host 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/app/tarefas`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      PUBLIC_SUPABASE_URL: '',
      PUBLIC_SUPABASE_ANON_KEY: '',
      PUBLIC_POSTHOG_HOST: '',
      PUBLIC_POSTHOG_KEY: '',
      PUBLIC_GA4_MEASUREMENT_ID: '',
    },
  },
});
