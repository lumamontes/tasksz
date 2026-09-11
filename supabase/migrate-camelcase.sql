-- Run once for databases created with the original unquoted schema.
-- PostgreSQL lowercases unquoted camelCase identifiers, while the client and
-- replication plugin use the exact camelCase names.

do $$
declare
  item record;
begin
  for item in
    select * from (values
      ('tasks', 'accountid', 'accountId'),
      ('tasks', 'createdat', 'createdAt'),
      ('tasks', 'scheduleddate', 'scheduledDate'),
      ('subtasks', 'accountid', 'accountId'),
      ('subtasks', 'taskid', 'taskId'),
      ('settings', 'accountid', 'accountId'),
      ('settings', 'themeid', 'themeId'),
      ('settings', 'custompalette', 'customPalette'),
      ('settings', 'fontid', 'fontId'),
      ('settings', 'fontscale', 'fontScale'),
      ('settings', 'showprogressbars', 'showProgressBars'),
      ('settings', 'reducemotion', 'reduceMotion'),
      ('settings', 'soundenabled', 'soundEnabled'),
      ('settings', 'pomodorosound', 'pomodoroSound'),
      ('settings', 'soundvolume', 'soundVolume'),
      ('settings', 'ticksoundenabled', 'tickSoundEnabled'),
      ('settings', 'focusmodeenabled', 'focusModeEnabled'),
      ('settings', 'celebrationsenabled', 'celebrationsEnabled'),
      ('profile', 'accountid', 'accountId')
    ) as columns(table_name, old_name, new_name)
  loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = item.table_name
        and column_name = item.old_name
    ) and not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = item.table_name
        and column_name = item.new_name
    ) then
      execute format(
        'alter table public.%I rename column %I to %I',
        item.table_name,
        item.old_name,
        item.new_name
      );
    end if;
  end loop;
end
$$;

-- The original script could stop before creating these policies because the
-- unquoted camelCase columns did not match the quoted policy expressions.
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.settings enable row level security;
alter table public.profile enable row level security;

drop policy if exists "users can read own tasks" on public.tasks;
drop policy if exists "users can insert own tasks" on public.tasks;
drop policy if exists "users can update own tasks" on public.tasks;
create policy "users can read own tasks" on public.tasks for select using (auth.uid()::text = "accountId");
create policy "users can insert own tasks" on public.tasks for insert with check (auth.uid()::text = "accountId");
create policy "users can update own tasks" on public.tasks for update using (auth.uid()::text = "accountId") with check (auth.uid()::text = "accountId");

drop policy if exists "users can read own subtasks" on public.subtasks;
drop policy if exists "users can insert own subtasks" on public.subtasks;
drop policy if exists "users can update own subtasks" on public.subtasks;
create policy "users can read own subtasks" on public.subtasks for select using (auth.uid()::text = "accountId");
create policy "users can insert own subtasks" on public.subtasks for insert with check (auth.uid()::text = "accountId");
create policy "users can update own subtasks" on public.subtasks for update using (auth.uid()::text = "accountId") with check (auth.uid()::text = "accountId");

drop policy if exists "users can read own settings" on public.settings;
drop policy if exists "users can insert own settings" on public.settings;
drop policy if exists "users can update own settings" on public.settings;
create policy "users can read own settings" on public.settings for select using (auth.uid()::text = "accountId");
create policy "users can insert own settings" on public.settings for insert with check (auth.uid()::text = "accountId");
create policy "users can update own settings" on public.settings for update using (auth.uid()::text = "accountId") with check (auth.uid()::text = "accountId");

drop policy if exists "users can read own profile" on public.profile;
drop policy if exists "users can insert own profile" on public.profile;
drop policy if exists "users can update own profile" on public.profile;
create policy "users can read own profile" on public.profile for select using (auth.uid()::text = "accountId");
create policy "users can insert own profile" on public.profile for insert with check (auth.uid()::text = "accountId");
create policy "users can update own profile" on public.profile for update using (auth.uid()::text = "accountId") with check (auth.uid()::text = "accountId");
