import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type App } from './fixtures/app';

const legacyBackup = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'backup-v1.json');

async function openDataSettings(app: App) {
  await app.goTo('Configurações');
  // Settings hydrates on visibility (`client:visible`); clicks on the server
  // HTML before that are lost. Astro drops `ssr` once the island hydrates.
  await expect(app.page.locator('astro-island[component-url*="SettingsPage"]:not([ssr])')).toHaveCount(1);
  await app.page.getByRole('button', { name: 'Dados' }).click();
  await expect(app.page.getByRole('button', { name: 'Baixar Backup' })).toBeVisible();
}

async function importBackup(app: App, file: string) {
  await openDataSettings(app);
  await app.page.getByLabel('Escolher Arquivo').setInputFiles(file);
  await app.confirmDialog('Substituir seus dados pelo backup?').getByRole('button', { name: 'Substituir dados' }).click();
}

test('keeps Areas, Projects and task assignments after a reload', async ({ app, page }) => {
  await app.open();
  await app.createArea('Trabalho');
  await app.createProject('Trabalho', 'Site');
  await app.createTask('Persistida', { area: 'Trabalho', project: 'Site' });

  await app.reload();

  await app.openProject('Trabalho', 'Site');
  await app.projectTasksTab.click();
  await expect(page.getByRole('list', { name: 'Tarefas de Site' })).toContainText('Persistida');
});

test('restores Areas, Projects and assignments from an exported backup', async ({ app, page }) => {
  await app.open();
  await app.createArea('Trabalho');
  await app.createProject('Trabalho', 'Site');
  await app.createTask('No backup', { area: 'Trabalho', project: 'Site' });

  await openDataSettings(app);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar Backup' }).click();
  const backupPath = await (await download).path();
  const backup = JSON.parse(await readFile(backupPath, 'utf8'));
  expect(backup.areas).toHaveLength(1);
  expect(backup.projects).toHaveLength(1);
  expect(backup.tasks[0].projectId).toBe(backup.projects[0].id);

  await page.getByRole('button', { name: 'Apagar todos os dados' }).click();
  await app.confirmDialog('Apagar todos os dados?').getByRole('button', { name: 'Apagar tudo' }).click();
  await expect(page.getByRole('tab', { name: 'Tarefas', exact: true })).toBeVisible();
  await app.goTo('Áreas');
  await expect(page.getByRole('heading', { name: 'Comece por uma área' })).toBeVisible();

  await importBackup(app, backupPath);

  await app.openProject('Trabalho', 'Site');
  await app.projectTasksTab.click();
  await expect(page.getByRole('list', { name: 'Tarefas de Site' })).toContainText('No backup');
});

test('imports a backup exported before Areas and Projects existed', async ({ app, page }) => {
  await app.open();
  await importBackup(app, legacyBackup);

  await app.goTo('Tarefas');
  await app.taskRow('Tarefa antiga').click();
  const detail = page.getByRole('dialog', { name: 'Tarefa antiga' });
  await expect(detail).toBeVisible();
  await expect(detail.getByRole('combobox', { name: 'Projeto' })).toHaveValue('');
  await expect(detail.getByRole('button', { name: 'Marcar como não concluída' })).toHaveCount(1);

  await app.goTo('Áreas');
  await expect(page.getByRole('heading', { name: 'Comece por uma área' })).toBeVisible();
});
