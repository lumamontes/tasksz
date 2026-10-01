import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, type Browser, type Page } from '@playwright/test';
import { App, test as appTest } from '../e2e/fixtures/app';
import { LOCAL_SUPABASE } from './localSupabase';

export { expect };

export const admin: SupabaseClient = createClient(LOCAL_SUPABASE.url, LOCAL_SUPABASE.serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const PASSWORD = 'senha-de-teste-123';

export function uniqueEmail(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@tarefitas.test`;
}

export class SignedInApp extends App {
  async signUp(email: string) {
    await this.authenticate(email, 'Criar conta');
  }

  async signIn(email: string) {
    await this.authenticate(email, 'Entrar');
  }

  private async authenticate(email: string, mode: 'Entrar' | 'Criar conta') {
    await this.page.getByRole('button', { name: 'Entrar' }).first().click();
    const form = this.page.getByRole('dialog');
    await form.getByRole('tab', { name: mode }).click();
    await form.getByLabel('E-mail').fill(email);
    await form.getByLabel('Senha', { exact: true }).fill(PASSWORD);
    await form.locator('button[type="submit"]').click();
    await expect(this.page.getByRole('button', { name: 'Sair da conta' }).first()).toBeVisible({ timeout: 15_000 });
    await this.page.keyboard.press('Escape');
    await expect(this.page.getByRole('dialog', { name: 'Entrar no Tarefitas' })).toHaveCount(0);
  }
}

export async function userIdFor(email: string): Promise<string> {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((item) => item.email === email);
  if (!user) throw new Error(`No user for ${email}`);
  return user.id;
}

/** Polls the server until `read` returns rows matching `predicate`. */
export async function eventuallyOnServer<T>(read: () => Promise<T[]>, predicate: (rows: T[]) => boolean, message: string) {
  await expect.poll(async () => predicate(await read()), { message, timeout: 20_000 }).toBe(true);
  return read();
}

export async function serverRows(table: 'areas' | 'projects' | 'tasks', column: string, value: string) {
  const { data, error } = await admin.from(table).select('*').eq(column, value);
  if (error) throw error;
  return data as Record<string, unknown>[];
}

/** Opens a second, independent browser profile ("another device"). */
export async function openSecondDevice(browser: Browser, baseURL: string): Promise<{ app: SignedInApp; page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext({ baseURL, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  const app = new SignedInApp(page);
  await app.open();
  return { app, page, close: () => context.close() };
}

export const test = appTest.extend<{ signedIn: SignedInApp }>({
  // Replication resolves duplicate or out-of-order inserts itself; the browser
  // still logs those HTTP 409 responses. Offline tests also lose Realtime.
  expectedConsoleErrors: [[/status of 409/, /WebSocket connection to .* failed/], { scope: 'test' }],
  signedIn: async ({ app }, use) => {
    await use(new SignedInApp(app.page));
  },
});
