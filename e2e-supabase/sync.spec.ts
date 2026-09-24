import { admin, eventuallyOnServer, expect, openSecondDevice, serverRows, test, uniqueEmail, userIdFor } from './fixtures';

type Row = Record<string, unknown>;

test('syncs Areas, Projects and assignments for a signed-in user and keeps them after reload', async ({ signedIn: app, page }) => {
  const email = uniqueEmail('persist');
  await app.open();
  await app.signUp(email);
  const userId = await userIdFor(email);

  await app.createArea('Trabalho');
  await app.createProject('Trabalho', 'Site');
  await app.createTask('Sincronizada', { area: 'Trabalho', project: 'Site' });

  const [area] = await eventuallyOnServer(() => serverRows('areas', 'account_id', userId), (rows) => rows.length === 1, 'area row');
  const [project] = await eventuallyOnServer(() => serverRows('projects', 'owner_id', userId), (rows) => rows[0]?.area_id === area.id, 'project row inside the area');
  await eventuallyOnServer(() => serverRows('tasks', 'account_id', userId), (rows) => rows.some((row) => row.title === 'Sincronizada' && row.project_id === project.id), 'task row inside the project');

  await app.reload();
  await app.openProject('Trabalho', 'Site');
  await app.projectTasksTab.click();
  await expect(page.getByRole('list', { name: 'Tarefas de Site' })).toContainText('Sincronizada');
});

test('re-keys guest Areas, Projects and tasks into the new account', async ({ signedIn: app, page }) => {
  await app.open();
  await app.createArea('Casa');
  await app.createProject('Casa', 'Mudança');
  await app.createTask('Da época de convidada', { area: 'Casa', project: 'Mudança' });

  const email = uniqueEmail('rekey');
  await app.signUp(email);
  const userId = await userIdFor(email);

  const [area] = await eventuallyOnServer(() => serverRows('areas', 'account_id', userId), (rows) => rows.length === 1, 'guest area uploaded');
  const [project] = await eventuallyOnServer(() => serverRows('projects', 'owner_id', userId), (rows) => rows[0]?.area_id === area.id, 'guest project uploaded');
  await eventuallyOnServer(() => serverRows('tasks', 'account_id', userId), (rows) => rows.some((row) => row.project_id === project.id), 'guest task uploaded');

  await app.openProject('Casa', 'Mudança');
  await app.projectTasksTab.click();
  await expect(page.getByRole('list', { name: 'Tarefas de Mudança' })).toContainText('Da época de convidada');
});

test('uploads Areas, Projects and assignments created offline once back online', async ({ signedIn: app, context }) => {
  const email = uniqueEmail('offline');
  await app.open();
  await app.signUp(email);
  const userId = await userIdFor(email);

  await context.setOffline(true);
  await app.createArea('Estudos');
  await app.createProject('Estudos', 'TCC');
  await app.createTask('Escrever introdução', { area: 'Estudos', project: 'TCC' });
  await context.setOffline(false);

  const [area] = await eventuallyOnServer(() => serverRows('areas', 'account_id', userId), (rows) => rows.length === 1, 'offline area uploaded');
  const [project] = await eventuallyOnServer(() => serverRows('projects', 'owner_id', userId), (rows) => rows[0]?.area_id === area.id, 'offline project uploaded with its area');
  await eventuallyOnServer(() => serverRows('tasks', 'account_id', userId), (rows) => rows.some((row) => row.project_id === project.id), 'offline task uploaded with its project');
});

test('propagates creates, edits and deletions to another device', async ({ signedIn: app, page, browser, baseURL }) => {
  const email = uniqueEmail('devices');
  await app.open();
  await app.signUp(email);
  const userId = await userIdFor(email);

  const other = await openSecondDevice(browser, baseURL!);
  try {
    await other.app.signIn(email);

    await app.createArea('Trabalho');
    await app.createArea('Casa');
    await app.createProject('Trabalho', 'Site');
    await app.createTask('Tarefa compartilhada', { area: 'Trabalho', project: 'Site' });

    await other.app.goTo('Áreas');
    await expect(other.app.areaButton('Trabalho')).toContainText('1 projeto', { timeout: 20_000 });

    // Edit on device A: rename and move the Project.
    await app.openProject('Trabalho', 'Site');
    await page.getByRole('button', { name: 'Editar projeto' }).click();
    await page.getByLabel('Nome do projeto').fill('Site novo');
    await page.getByLabel('Área do projeto').selectOption({ label: 'Casa' });
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(other.app.areaButton('Casa')).toContainText('1 projeto', { timeout: 20_000 });
    await other.app.openProject('Casa', 'Site novo');

    // Delete on device A: the Area and its Projects, keeping the task.
    await app.openArea('Casa');
    await page.getByRole('button', { name: 'Excluir área' }).click();
    await app.confirmDialog('Excluir a área “Casa”?').getByRole('button', { name: 'Excluir área' }).click();

    await expect(other.app.areaButton('Casa')).toHaveCount(0, { timeout: 20_000 });
    await other.app.goTo('Tarefas');
    await other.app.taskRow('Tarefa compartilhada').click();
    await expect(other.page.getByRole('button', { name: 'Remover projeto da tarefa' })).toHaveCount(0, { timeout: 20_000 });

    const areas = await serverRows('areas', 'account_id', userId);
    expect(areas.find((row: Row) => row.name === 'Casa')?._deleted).toBe(true);
    const projects = await serverRows('projects', 'owner_id', userId);
    expect(projects.every((row: Row) => row._deleted === true)).toBe(true);
  } finally {
    await other.close();
  }
});

test.afterAll(async () => {
  // Accounts are throwaway; nothing to clean on a local stack, but keep the
  // admin client from holding the worker open.
  await admin.removeAllChannels();
});

test('syncs edits made to existing tasks and Projects', async ({ signedIn: app, page }) => {
  const email = uniqueEmail('edits');
  await app.open();
  await app.signUp(email);
  const userId = await userIdFor(email);

  await app.createArea('Trabalho');
  await app.createProject('Trabalho', 'Site');
  await app.createTask('Editar logo em seguida');
  // Regression: optimistic update filters never matched, so edits of synced
  // rows were rejected as conflicts and reverted to the server version.
  await page.getByRole('dialog', { name: 'Editar logo em seguida' }).getByRole('button', { name: 'Marcar tarefa inteira como concluída' }).click();
  await eventuallyOnServer(() => serverRows('tasks', 'account_id', userId), (rows) => rows[0]?.completed === true, 'task completion synced');

  await app.chooseOrganization('Trabalho', 'Site');
  const [project] = await serverRows('projects', 'owner_id', userId);
  await eventuallyOnServer(() => serverRows('tasks', 'account_id', userId), (rows) => rows[0]?.project_id === project.id, 'task assignment synced');

  await app.openProject('Trabalho', 'Site');
  await page.getByRole('button', { name: 'Editar projeto' }).click();
  await page.getByLabel('Descrição').fill('Nova descrição');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await eventuallyOnServer(() => serverRows('projects', 'owner_id', userId), (rows) => rows[0]?.description === 'Nova descrição', 'project edit synced');

  await app.reload();
  await app.goTo('Tarefas');
  await app.taskRow('Editar logo em seguida').click();
  await expect(page.getByRole('dialog', { name: 'Editar logo em seguida' }).getByRole('button', { name: 'Marcar tarefa como não concluída' })).toBeVisible();
});
