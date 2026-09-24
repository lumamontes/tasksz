import { test as base, expect, type Locator, type Page } from '@playwright/test';

export { expect };

const ALLOWED_HOSTS = new Set(['127.0.0.1', 'localhost', 'fonts.googleapis.com', 'fonts.gstatic.com']);

/**
 * Every test starts in a fresh browser context (empty IndexedDB). Requests to
 * any other host (Supabase, analytics, ...) are aborted and fail the test,
 * as do console errors and uncaught exceptions.
 */
export const test = base.extend<{ app: App; expectedConsoleErrors: RegExp[] }>({
  /** Console errors a suite expects, e.g. handled sync conflicts. */
  expectedConsoleErrors: [[], { option: true }],
  app: async ({ page, context, expectedConsoleErrors }, use) => {
    const problems: string[] = [];
    await context.route((url) => url.protocol.startsWith('http') && !ALLOWED_HOSTS.has(url.hostname), (route) => {
      problems.push(`blocked request: ${new URL(route.request().url()).origin}`);
      return route.abort();
    });

    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      // Aborted requests are reported above with their origin, and tests that
      // go offline on purpose expect the browser's own network errors.
      const expectedNetworkNoise = [/net::ERR_FAILED|net::ERR_INTERNET_DISCONNECTED/, ...expectedConsoleErrors].some((pattern) => pattern.test(message.text()));
      if (message.type() === 'error' && !expectedNetworkNoise) problems.push(`console: ${message.text()}`);
    });

    await use(new App(page));

    expect(problems, 'no console errors or uncaught exceptions').toEqual([]);
  },
});

type Section = 'Tarefas' | 'Áreas' | 'Configurações';

export class App {
  constructor(readonly page: Page) {}

  /** Waits until local storage is ready and the shell is interactive. */
  async ready() {
    await expect(this.page.locator('#app-shell:not([inert])')).toHaveCount(1);
  }

  async open() {
    await this.page.goto('/app/tarefas');
    await this.ready();
    await expect(this.page.getByRole('tab', { name: 'Tarefas', exact: true })).toBeVisible();
    await expect(this.page.getByRole('button', { name: 'Nova tarefa' })).toBeVisible();
  }

  async reload() {
    await this.page.reload();
    await this.ready();
    await expect(this.page.getByRole('tab', { name: 'Tarefas', exact: true })).toBeVisible();
  }

  async goTo(section: Section) {
    await this.page.getByRole('tab', { name: section, exact: true }).click();
  }

  /** A task in the Tasks tab list. */
  taskRow(title: string): Locator {
    return this.page.getByRole('main').getByRole('button').filter({ hasText: title });
  }

  /** The "Tarefas" tab of the open Project. */
  get projectTasksTab(): Locator {
    return this.page.getByRole('tablist', { name: 'Seções do projeto' }).getByRole('tab', { name: /^Tarefas/ });
  }

  /** The Areas list pane. */
  get areaList(): Locator {
    return this.page.getByRole('navigation', { name: 'Áreas' });
  }

  areaButton(name: string): Locator {
    return this.areaList.getByRole('button', { name: new RegExp(`^${name} \\d+ projetos?$`) });
  }

  async createArea(name: string) {
    await this.goTo('Áreas');
    await this.areaList.getByRole('button', { name: 'Nova área' }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Nova área' });
    await dialog.getByLabel('Nome da área').fill(name);
    await dialog.getByRole('button', { name: 'Criar área' }).click();
    await expect(dialog).toBeHidden();
    await expect(this.areaButton(name)).toBeVisible();
  }

  async openArea(name: string) {
    await this.goTo('Áreas');
    await this.areaButton(name).click();
    await expect(this.page.getByRole('heading', { level: 2, name })).toBeVisible();
  }

  async createProject(areaName: string, projectName: string) {
    await this.openArea(areaName);
    const first = this.page.getByRole('button', { name: 'Criar o primeiro projeto' });
    if (await first.isVisible()) {
      await first.click();
    } else {
      await this.page.getByRole('button', { name: 'Ver todos' }).click();
      await this.page.getByRole('button', { name: 'Novo projeto' }).click();
    }
    const dialog = this.page.getByRole('dialog', { name: 'Novo projeto' });
    await dialog.getByLabel('Nome do projeto').fill(projectName);
    await dialog.getByRole('button', { name: 'Criar projeto' }).click();
    await expect(dialog).toBeHidden();
    await expect(this.page.getByRole('heading', { level: 2, name: projectName })).toBeVisible();
  }

  async openProject(areaName: string, projectName: string) {
    await this.openArea(areaName);
    await this.page.getByRole('list', { name: `Projetos de ${areaName}` }).getByRole('button', { name: new RegExp(`^${projectName} `) }).click();
    await expect(this.page.getByRole('heading', { level: 2, name: projectName })).toBeVisible();
  }

  /** Creates a task from the Tasks tab, optionally scheduled and inside a Project. */
  async createTask(title: string, options: { when?: 'Hoje' | 'Amanhã'; area?: string; project?: string } = {}) {
    await this.goTo('Tarefas');
    await this.page.getByRole('button', { name: 'Nova tarefa' }).click();
    await this.page.getByRole('textbox', { name: /O que você precisa fazer/ }).fill(title);
    if (options.when) await this.page.getByRole('button', { name: options.when, exact: true }).click();
    if (options.area) await this.chooseOrganization(options.area, options.project);
    await this.page.getByRole('button', { name: 'Criar tarefa' }).click();
    if (options.when === 'Amanhã') {
      // The Tasks list shows today, so it closes a task scheduled for later.
      await expect(this.page.getByRole('button', { name: 'Criar tarefa' })).toHaveCount(0);
    } else {
      await expect(this.page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    }
  }

  /** Uses the organization combobox inside the visible task form or detail. */
  async chooseOrganization(area: string, project?: string) {
    await this.page.getByRole('combobox', { name: 'Área' }).fill(area.slice(0, 3));
    await this.page.getByRole('option', { name: area }).click();
    if (!project) return;
    await this.page.getByRole('combobox', { name: /Projeto/ }).click();
    await this.page.getByRole('option', { name: project }).click();
    await expect(this.page.getByRole('button', { name: 'Remover projeto da tarefa' })).toBeVisible();
  }

  confirmDialog(title: string | RegExp): Locator {
    return this.page.getByRole('alertdialog', { name: title });
  }
}
