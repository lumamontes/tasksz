import { defineConfig, devices } from '@playwright/test';
import { LOCAL_SUPABASE } from './e2e-supabase/localSupabase';

const PORT = 4322;

/**
 * Signed-in, re-keying, sync and RLS checks against a LOCAL Supabase
 * (`supabase start`, schema from supabase/schema.sql). Never point this at a
 * hosted project: tests create and delete accounts freely.
 */
export default defineConfig({
  testDir: './e2e-supabase',
  fullyParallel: true,
  workers: 2,
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    viewport: { width: 1400, height: 900 },
  },
  webServer: {
    command: `pnpm build && pnpm preview --host 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/app/tarefas`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      TAREFITAS_OUT_DIR: './dist-supabase-e2e',
      PUBLIC_SUPABASE_URL: LOCAL_SUPABASE.url,
      PUBLIC_SUPABASE_ANON_KEY: LOCAL_SUPABASE.anonKey,
      PUBLIC_POSTHOG_HOST: '',
      PUBLIC_POSTHOG_KEY: '',
      PUBLIC_GA4_MEASUREMENT_ID: '',
    },
  },
});
