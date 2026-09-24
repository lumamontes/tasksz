import { expect, test } from './fixtures/app';

test('Escape closes only the confirmation and returns focus to its trigger', async ({ app, page }) => {
  await app.open();
  await app.createTask('Não apagar');

  await page.getByRole('button', { name: 'Excluir tarefa' }).click();
  const confirm = app.confirmDialog('Excluir tarefa?');
  await expect(confirm.getByRole('button', { name: 'Cancelar' })).toBeFocused();
  await page.keyboard.press('Escape');

  await expect(confirm).toBeHidden();
  await expect(page.getByRole('dialog', { name: 'Não apagar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Excluir tarefa' })).toBeFocused();
});

test('Enter on a destructive confirmation cancels by default', async ({ app, page }) => {
  await app.open();
  await app.createTask('Com passos');
  await page.getByRole('button', { name: 'Criar 3 passos' }).click();

  await page.getByRole('button', { name: /^Excluir subtarefa/ }).first().click();
  await page.keyboard.press('Enter');

  await expect(app.confirmDialog('Excluir subtarefa?')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Marcar como concluída' })).toHaveCount(3);
});

test('deletes a task and archives another after confirmation', async ({ app, page }) => {
  await app.open();
  await app.createTask('Para excluir');
  await page.getByRole('button', { name: 'Excluir tarefa' }).click();
  await app.confirmDialog('Excluir tarefa?').getByRole('button', { name: 'Excluir tarefa' }).click();
  await expect(app.taskRow('Para excluir')).toHaveCount(0);

  await app.createTask('Para arquivar');
  await page.getByRole('button', { name: 'Arquivar tarefa' }).click();
  await app.confirmDialog('Arquivar tarefa?').getByRole('button', { name: 'Arquivar' }).click();
  await expect(app.taskRow('Para arquivar')).toHaveCount(0);
});
