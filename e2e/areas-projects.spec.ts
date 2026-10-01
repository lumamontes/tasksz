import { expect, test } from './fixtures/app';

test.describe('Areas', () => {
  test('creates, renames and deletes an Area', async ({ app, page }) => {
    await app.open();
    await app.createArea('Trabalho');

    await app.openArea('Trabalho');
    await page.getByRole('button', { name: 'Editar área' }).click();
    await page.getByLabel('Nome da área').fill('Trabalho remoto');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(app.areaButton('Trabalho remoto')).toBeVisible();

    await page.getByRole('button', { name: 'Excluir área' }).click();
    const confirm = app.confirmDialog('Excluir a área “Trabalho remoto”?');
    await expect(confirm).toContainText('Esta área não tem projetos.');
    await confirm.getByRole('button', { name: 'Excluir área' }).click();

    await expect(app.areaButton('Trabalho remoto')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Comece por uma área' })).toBeVisible();
  });

  test('creates suggested Areas after confirmation', async ({ app, page }) => {
    await app.open();
    await app.goTo('Áreas');
    await page.getByRole('button', { name: 'Usar sugestões' }).click();
    await app.confirmDialog('Usar áreas sugeridas?').getByRole('button', { name: 'Criar áreas' }).click();

    for (const name of ['Autocuidado', 'Trabalho', 'Estudos', 'Casa', 'Lazer']) {
      await expect(app.areaButton(name)).toBeVisible();
    }
  });

  test('deleting an Area moves its Projects to another Area', async ({ app, page }) => {
    await app.open();
    await app.createArea('Trabalho');
    await app.createArea('Casa');
    await app.createProject('Trabalho', 'Site');
    await app.createTask('Escrever textos', { area: 'Trabalho', project: 'Site' });

    await app.openArea('Trabalho');
    await page.getByRole('button', { name: 'Excluir área' }).click();
    const confirm = app.confirmDialog('Excluir a área “Trabalho”?');
    await confirm.getByRole('radio', { name: /Mover os projetos/ }).check();
    await confirm.getByLabel('Mover para').selectOption({ label: 'Casa' });
    await confirm.getByRole('button', { name: 'Excluir área' }).click();

    await expect(app.areaButton('Trabalho')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: 'Casa' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Projetos de Casa' })).toContainText('Site1 tarefa');
  });

  test('deleting an Area deletes its Projects and, when chosen, their tasks', async ({ app, page }) => {
    await app.open();
    await app.createArea('Trabalho');
    await app.createProject('Trabalho', 'Site');
    await app.createProject('Trabalho', 'App');
    await app.createTask('Tarefa do site', { area: 'Trabalho', project: 'Site' });
    await app.createTask('Tarefa do app', { area: 'Trabalho', project: 'App' });

    await app.openArea('Trabalho');
    await page.getByRole('button', { name: 'Excluir área' }).click();
    const confirm = app.confirmDialog('Excluir a área “Trabalho”?');
    await expect(confirm.getByRole('radio', { name: /Excluir os projetos/ })).toBeChecked();
    await expect(confirm.getByRole('radio', { name: /Mover os projetos/ })).toBeDisabled();
    const deleteTasks = confirm.getByRole('checkbox', { name: /Excluir também as 2 tarefas/ });
    await expect(deleteTasks).not.toBeChecked();
    await deleteTasks.check();
    await confirm.getByRole('button', { name: 'Excluir área' }).click();

    await expect(app.areaButton('Trabalho')).toHaveCount(0);
    await app.goTo('Tarefas');
    await expect(app.taskRow('Tarefa do site')).toHaveCount(0);
    await expect(app.taskRow('Tarefa do app')).toHaveCount(0);
  });
});

test.describe('Projects', () => {
  test('edits a Project, moves it to another Area and deletes it keeping its tasks', async ({ app, page }) => {
    await app.open();
    await app.createArea('Trabalho');
    await app.createArea('Estudos');
    await app.createProject('Trabalho', 'Site');
    await app.createTask('Revisar layout', { area: 'Trabalho', project: 'Site' });

    await app.openProject('Trabalho', 'Site');
    await page.getByRole('button', { name: 'Editar projeto' }).click();
    await page.getByLabel('Nome do projeto').fill('Site novo');
    await page.getByLabel('Descrição').fill('Lançamento em outubro');
    await page.getByLabel('Área do projeto').selectOption({ label: 'Estudos' });
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByRole('heading', { level: 2, name: 'Site novo' })).toBeVisible();
    await expect(page.getByText('Lançamento em outubro')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Voltar para Estudos' })).toBeVisible();
    await expect(app.areaButton('Estudos')).toContainText('1 projeto');

    await page.getByRole('button', { name: 'Excluir projeto' }).click();
    const confirm = app.confirmDialog('Excluir o projeto “Site novo”?');
    await expect(confirm.getByRole('checkbox', { name: /Excluir também a tarefa/ })).not.toBeChecked();
    await confirm.getByRole('button', { name: 'Excluir projeto' }).click();

    await expect(page.getByRole('heading', { level: 2, name: 'Estudos' })).toBeVisible();
    await app.goTo('Tarefas');
    await app.taskRow('Revisar layout').click();
    await expect(page.getByRole('button', { name: 'Remover projeto da tarefa' })).toHaveCount(0);
  });

  test('opens a Project task scheduled on another day and walks the Project tasks', async ({ app, page }) => {
    await app.open();
    await app.createArea('Trabalho');
    await app.createProject('Trabalho', 'Site');
    await app.createTask('Primeira', { area: 'Trabalho', project: 'Site' });
    await app.createTask('Segunda amanhã', { when: 'Amanhã', area: 'Trabalho', project: 'Site' });

    // The Tasks tab shows today; the Project task must stay open anyway.
    await app.openProject('Trabalho', 'Site');
    await app.projectTasksTab.click();
    const tasks = page.getByRole('list', { name: 'Tarefas de Site' });
    await expect(tasks.getByRole('button')).toHaveCount(2);
    await tasks.getByRole('button', { name: /Segunda amanhã/ }).click();

    const detail = page.getByRole('dialog', { name: 'Segunda amanhã' });
    await expect(detail).toBeVisible();
    await detail.getByRole('button', { name: 'Tarefa anterior' }).click();
    await expect(page.getByRole('dialog', { name: 'Primeira' })).toBeVisible();

    await page.getByRole('button', { name: 'Voltar para Site' }).click();
    await expect(tasks).toBeVisible();
  });
});
