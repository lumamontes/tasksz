import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import { LOCAL_SUPABASE } from './localSupabase';
import { admin, PASSWORD, uniqueEmail } from './fixtures';

/** A real user session through the public (anon) key, like the app uses. */
async function userClient(label: string) {
  const email = uniqueEmail(label);
  const client = createClient(LOCAL_SUPABASE.url, LOCAL_SUPABASE.anonKey, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signUp({ email, password: PASSWORD });
  if (error || !data.user) throw error ?? new Error('sign up failed');
  // A brand-new token can briefly be rejected as "JWT issued at future"
  // (PGRST303) by the local PostgREST; the app retries it, and so does this.
  await expect.poll(async () => (await client.from('areas').select('id').limit(1)).error?.code ?? 'ok', { timeout: 10_000 }).toBe('ok');
  return { client, userId: data.user.id };
}

const now = () => new Date().toISOString();

test('RLS keeps Areas, Projects and tasks private to their owner', async () => {
  const owner = await userClient('owner');
  const intruder = await userClient('intruder');
  const suffix = Math.random().toString(36).slice(2, 8);
  const areaId = `area_rls_${suffix}`;
  const projectId = `project_rls_${suffix}`;
  const taskId = `task_rls_${suffix}`;

  // The owner can create their own rows.
  expect((await owner.client.from('areas').insert({ id: areaId, account_id: owner.userId, name: 'Privada', created_at: now() })).error).toBeNull();
  expect((await owner.client.from('projects').insert({ id: projectId, owner_id: owner.userId, created_by: owner.userId, name: 'Projeto', area_id: areaId })).error).toBeNull();
  expect((await owner.client.from('tasks').insert({ id: taskId, account_id: owner.userId, created_by: owner.userId, title: 'Tarefa', created_at: now(), project_id: projectId })).error).toBeNull();

  // The intruder cannot read them.
  for (const table of ['areas', 'projects', 'tasks'] as const) {
    const { data, error } = await intruder.client.from(table).select('id').in('id', [areaId, projectId, taskId]);
    expect(error).toBeNull();
    expect(data, `${table} hidden from other users`).toEqual([]);
  }

  // Updates and soft deletes affect nothing.
  await intruder.client.from('areas').update({ name: 'Invadida', _deleted: true }).eq('id', areaId);
  await intruder.client.from('projects').update({ name: 'Invadido', area_id: null }).eq('id', projectId);
  await intruder.client.from('tasks').update({ title: 'Invadida', project_id: null }).eq('id', taskId);
  const area = (await admin.from('areas').select('name,_deleted').eq('id', areaId).single()).data;
  const project = (await admin.from('projects').select('name,area_id').eq('id', projectId).single()).data;
  const task = (await admin.from('tasks').select('title,project_id').eq('id', taskId).single()).data;
  expect(area).toEqual({ name: 'Privada', _deleted: false });
  expect(project).toEqual({ name: 'Projeto', area_id: areaId });
  expect(task).toEqual({ title: 'Tarefa', project_id: projectId });

  // Rows cannot be created on someone else's behalf.
  expect((await intruder.client.from('areas').insert({ id: `area_fake_${suffix}`, account_id: owner.userId, name: 'X', created_at: now() })).error?.code).toBe('42501');
  expect((await intruder.client.from('projects').insert({ id: `project_fake_${suffix}`, owner_id: owner.userId, created_by: owner.userId, name: 'X' })).error?.code).toBe('42501');
  expect((await intruder.client.from('tasks').insert({ id: `task_fake_${suffix}`, account_id: owner.userId, created_by: owner.userId, title: 'X', created_at: now() })).error?.code).toBe('42501');

  // Nobody can hard-delete through the API; deletion is a synced soft delete.
  await owner.client.from('areas').delete().eq('id', areaId);
  expect((await admin.from('areas').select('id').eq('id', areaId)).data).toHaveLength(1);
});

test('a user cannot take over an existing id owned by someone else', async () => {
  const owner = await userClient('owner-id');
  const intruder = await userClient('intruder-id');
  const areaId = `area_taken_${Math.random().toString(36).slice(2, 8)}`;
  await owner.client.from('areas').insert({ id: areaId, account_id: owner.userId, name: 'Original', created_at: now() });

  // RLS turns the conflicting update into a no-op; the row must be unchanged.
  await intruder.client.from('areas').upsert({ id: areaId, account_id: intruder.userId, name: 'Tomada', created_at: now() });
  expect((await admin.from('areas').select('account_id,name').eq('id', areaId).single()).data).toEqual({ account_id: owner.userId, name: 'Original' });
});
