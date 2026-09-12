-- Safe production migration for existing Tarefitas installations.
-- Does not alter or delete existing task rows.

begin;

create or replace function public.prevent_task_account_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.account_id <> old.account_id then
    raise exception 'task account_id cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_task_account_change on public.tasks;
create trigger prevent_task_account_change
  before update on public.tasks
  for each row execute function public.prevent_task_account_change();

drop policy if exists "users can insert own tasks" on public.tasks;
create policy "users can insert own tasks"
  on public.tasks for insert
  with check (
    auth.uid()::text = account_id
    and created_by = auth.uid()::text
  );

drop policy if exists "users can update own tasks" on public.tasks;
create policy "users can update own tasks"
  on public.tasks for update
  using (auth.uid()::text = account_id)
  with check (auth.uid()::text = account_id);

commit;
