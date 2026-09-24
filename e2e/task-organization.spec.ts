import { expect, test } from './fixtures/app';

test('assigns and removes a Project from the task form and detail', async ({ app, page }) => {
  await app.open();
  await app.createArea('Casa');
  await app.createProject('Casa', 'Mudança');

  // Regression: choosing a Project used to clear it immediately.
  await app.createTask('Comprar caixas', { area: 'Casa', project: 'Mudança' });
  await expect(page.getByRole('button', { name: 'Remover projeto da tarefa' })).toBeVisible();

  await app.openProject('Casa', 'Mudança');
  await expect(app.projectTasksTab).toContainText('1');

  await app.goTo('Tarefas');
  await app.taskRow('Comprar caixas').click();
  await page.getByRole('button', { name: 'Remover projeto da tarefa' }).click();
  await expect(page.getByRole('button', { name: 'Remover projeto da tarefa' })).toHaveCount(0);

  await app.openProject('Casa', 'Mudança');
  await app.projectTasksTab.click();
  await expect(page.getByRole('list', { name: 'Tarefas de Mudança' })).toContainText('Nenhuma tarefa neste projeto.');
});

test('assigns a Project from the task detail to a task created without one', async ({ app, page }) => {
  await app.open();
  await app.createArea('Casa');
  await app.createProject('Casa', 'Mudança');
  await app.createTask('Sem organização');

  // Regression: picking only an Area was not stored, so the Project field
  // never appeared in the task detail.
  await app.chooseOrganization('Casa', 'Mudança');

  await app.openProject('Casa', 'Mudança');
  await app.projectTasksTab.click();
  await expect(page.getByRole('list', { name: 'Tarefas de Mudança' })).toContainText('Sem organização');
});

test('groups tasks by Area and keeps tasks without one visible', async ({ app, page }) => {
  await app.open();
  await app.createArea('Casa');
  await app.createProject('Casa', 'Mudança');
  await app.createTask('Com projeto', { area: 'Casa', project: 'Mudança' });
  await app.createTask('Sem projeto');

  await app.goTo('Tarefas');
  await page.getByRole('button', { name: 'Filtrar e organizar tarefas' }).click();
  await page.getByRole('menuitemradio', { name: 'Agrupar por área' }).click();

  const groups = page.getByRole('main').getByRole('heading', { level: 3 });
  await expect(groups.filter({ hasText: /^(Casa|Sem área)$/ })).toHaveText(['Casa', 'Sem área']);
  await expect(app.taskRow('Com projeto')).toBeVisible();
  await expect(app.taskRow('Sem projeto')).toBeVisible();
});

test('one key press toggles a subtask once even with several detail panels mounted', async ({ app, page }) => {
  await app.open();
  await app.createTask('Com passos');
  await page.getByRole('button', { name: 'Criar 3 passos' }).click();
  await expect(page.getByRole('button', { name: 'Marcar como concluída' })).toHaveCount(3);

  await page.getByRole('heading', { level: 1, name: 'Com passos' }).click();
  await page.keyboard.press('Space');

  await expect(page.getByRole('button', { name: 'Marcar como não concluída' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Marcar como concluída' })).toHaveCount(2);
});
