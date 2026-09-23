-- Tarefitas — Supabase schema for RxDB replication
--
-- Run this in the Supabase SQL editor of your project. It creates the four
-- tables the RxDB ↔ Supabase replication plugin syncs (one per local
-- collection), enables RLS scoped to the signed-in account, adds soft-delete
-- + modified timestamps, and puts the tables in the realtime publication so
-- other devices get live updates.
--
-- Conventions required by rxdb/plugins/replication-supabase:
--   * text primary key named after the local collection primary key (id)
--   * database columns use snake_case; the client maps them to RxDB fields
--   * `_modified timestamptz` auto-updated by trigger
--   * `_deleted boolean` for soft deletes (never hard-delete rows)
--   * realtime enabled on every table
--   * RLS scoped to account_id = auth.uid()::text (the app sets account_id on
--     every write when a user is signed in)

-- ---------------------------------------------------------------------------
-- Tables: projects and project membership
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id         text primary key,
  owner_id   text not null,
  created_by text not null,
  name       text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  _modified  timestamptz not null default now(),
  _deleted   boolean not null default false
);

create table if not exists public.project_members (
  project_id text not null references public.projects(id) on delete cascade,
  user_id    text not null,
  role       text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table public.projects add column if not exists created_by text;
update public.projects set created_by = owner_id where created_by is null;
alter table public.projects alter column created_by set not null;

alter table public.projects enable row level security;
alter table public.project_members enable row level security;

create or replace function public.is_project_member(target_project_id text, target_user_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_members
    where project_id = target_project_id and user_id = target_user_id
  );
$$;

create or replace function public.is_project_owner(target_project_id text, target_user_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects
    where id = target_project_id and owner_id = target_user_id
  );
$$;

create or replace function public.stamp_created_by()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = auth.uid()::text;
  else
    new.created_by = old.created_by;
  end if;
  return new;
end;
$$;

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

drop policy if exists "project members can read projects" on public.projects;
create policy "project members can read projects"
  on public.projects for select
  using (
    auth.uid()::text = owner_id
    or public.is_project_member(id, auth.uid()::text)
  );

drop policy if exists "users can create projects" on public.projects;
create policy "users can create projects"
  on public.projects for insert
  with check (auth.uid()::text = owner_id and created_by = auth.uid()::text);

drop policy if exists "project owners can update projects" on public.projects;
create policy "project owners can update projects"
  on public.projects for update
  using (auth.uid()::text = owner_id)
  with check (auth.uid()::text = owner_id);

drop policy if exists "project members can read membership" on public.project_members;
create policy "project members can read membership"
  on public.project_members for select
  using (
    user_id = auth.uid()::text
    or public.is_project_owner(project_id, auth.uid()::text)
  );

drop policy if exists "project owners can manage membership" on public.project_members;
create policy "project owners can manage membership"
  on public.project_members for all
  using (public.is_project_owner(project_id, auth.uid()::text))
  with check (public.is_project_owner(project_id, auth.uid()::text));

-- ---------------------------------------------------------------------------
-- Table: tasks
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id           text primary key,
  account_id   text not null,
  created_by   text,
  project_id   text references public.projects(id),
  assignee_id  text,
  title        text not null,
  description  text not null default '',
  created_at   text not null,
  sort_order   numeric not null default 0,
  archived     boolean not null default false,
  scheduled_date text,
  start_date   text,
  end_date     text,
  recurring    text,

  _modified timestamptz not null default now(),
  _deleted  boolean not null default false
);

-- `order` is reserved by PostgREST as a query parameter. Move legacy rows to
-- `sort_order` so replication can use equality filters without ambiguity.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'order'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'sort_order'
  ) then
    alter table public.tasks rename column "order" to sort_order;
  end if;
end $$;

alter table public.tasks add column if not exists created_by text;
update public.tasks set created_by = account_id where created_by is null;
alter table public.tasks alter column created_by set not null;

alter table public.tasks enable row level security;

drop policy if exists "users can read own tasks" on public.tasks;
drop policy if exists "users can insert own tasks" on public.tasks;
drop policy if exists "users can update own tasks" on public.tasks;

create policy "users can read own tasks"
  on public.tasks for select
  using (
    auth.uid()::text = account_id
    or public.is_project_member(project_id, auth.uid()::text)
  );

create policy "users can insert own tasks"
  on public.tasks for insert
  with check (
    auth.uid()::text = account_id
    and created_by = auth.uid()::text
  );

create policy "users can update own tasks"
  on public.tasks for update
  using (
    auth.uid()::text = account_id
  )
  with check (
    auth.uid()::text = account_id
  );

-- ---------------------------------------------------------------------------
-- Table: subtasks
-- ---------------------------------------------------------------------------
create table if not exists public.subtasks (
  id          text primary key,
  account_id  text not null,
  task_id     text not null,
  title       text not null,
  description text not null default '',
  done        boolean not null default false,
  sort_order  numeric not null default 0,

  _modified timestamptz not null default now(),
  _deleted  boolean not null default false
);

-- ---------------------------------------------------------------------------
-- Table: private areas
-- ---------------------------------------------------------------------------
create table if not exists public.areas (
  id           text primary key,
  account_id   text not null,
  name         text not null,
  description  text not null default '',
  color        text,
  sort_order   numeric not null default 0,
  created_at   text not null,
  _modified    timestamptz not null default now(),
  _deleted     boolean not null default false
);

alter table public.areas enable row level security;

drop policy if exists "users can read own areas" on public.areas;
create policy "users can read own areas"
  on public.areas for select using (auth.uid()::text = account_id);

drop policy if exists "users can insert own areas" on public.areas;
create policy "users can insert own areas"
  on public.areas for insert with check (auth.uid()::text = account_id);

drop policy if exists "users can update own areas" on public.areas;
create policy "users can update own areas"
  on public.areas for update using (auth.uid()::text = account_id)
  with check (auth.uid()::text = account_id);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'subtasks' and column_name = 'order'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'subtasks' and column_name = 'sort_order'
  ) then
    alter table public.subtasks rename column "order" to sort_order;
  end if;
end $$;

alter table public.subtasks enable row level security;

drop policy if exists "users can read own subtasks" on public.subtasks;
drop policy if exists "users can insert own subtasks" on public.subtasks;
drop policy if exists "users can update own subtasks" on public.subtasks;

create policy "users can read own subtasks"
  on public.subtasks for select
  using (auth.uid()::text = account_id);

create policy "users can insert own subtasks"
  on public.subtasks for insert
  with check (auth.uid()::text = account_id);

create policy "users can update own subtasks"
  on public.subtasks for update
  using (auth.uid()::text = account_id)
  with check (auth.uid()::text = account_id);

-- ---------------------------------------------------------------------------
-- Table: settings (single row per account, id 'default')
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  id             text primary key,
  account_id     text not null,
  theme_id       text not null default 'calm-beige',
  custom_palette text,
  font_id        text not null default 'system',
  font_scale     text not null default 'md',
  density        text not null default 'cozy',
  show_progress_bars boolean not null default true,
  reduce_motion boolean not null default false,
  sound_enabled boolean not null default false,
  pomodoro_sound text not null default 'none',
  sound_volume numeric not null default 0.6,
  tick_sound_enabled boolean not null default false,
  focus_mode_enabled boolean not null default false,
  celebrations_enabled boolean not null default false,
  pomodoro       text,

  _modified timestamptz not null default now(),
  _deleted  boolean not null default false
);

alter table public.settings enable row level security;
create unique index if not exists settings_account_id_key on public.settings(account_id);

drop policy if exists "users can read own settings" on public.settings;
drop policy if exists "users can insert own settings" on public.settings;
drop policy if exists "users can update own settings" on public.settings;

create policy "users can read own settings"
  on public.settings for select
  using (auth.uid()::text = account_id);

create policy "users can insert own settings"
  on public.settings for insert
  with check (auth.uid()::text = account_id);

create policy "users can update own settings"
  on public.settings for update
  using (auth.uid()::text = account_id)
  with check (auth.uid()::text = account_id);

-- ---------------------------------------------------------------------------
-- Table: profile (single row per account, id 'default')
-- ---------------------------------------------------------------------------
create table if not exists public.profile (
  id        text primary key,
  account_id text not null,
  name      text not null default '',

  _modified timestamptz not null default now(),
  _deleted  boolean not null default false
);

alter table public.profile enable row level security;
create unique index if not exists profile_account_id_key on public.profile(account_id);

drop policy if exists "users can read own profile" on public.profile;
drop policy if exists "users can insert own profile" on public.profile;
drop policy if exists "users can update own profile" on public.profile;

create policy "users can read own profile"
  on public.profile for select
  using (auth.uid()::text = account_id);

create policy "users can insert own profile"
  on public.profile for insert
  with check (auth.uid()::text = account_id);

create policy "users can update own profile"
  on public.profile for update
  using (auth.uid()::text = account_id)
  with check (auth.uid()::text = account_id);

-- ---------------------------------------------------------------------------
-- `_modified` auto-update trigger (all tables)
-- ---------------------------------------------------------------------------
create or replace function public.set_modified_timestamp()
returns trigger
language plpgsql
as $$
begin
  new._modified = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['tasks', 'subtasks', 'settings', 'profile', 'areas', 'projects']
  loop
    execute format($x$
      drop trigger if exists set_modified_trigger on public.%I;
      create trigger set_modified_trigger
      before update on public.%I
      for each row
      execute function public.set_modified_timestamp()
    $x$, t, t);
  end loop;

  drop trigger if exists prevent_task_account_change on public.tasks;
  create trigger prevent_task_account_change
    before update on public.tasks
    for each row execute function public.prevent_task_account_change();
end
$$;

do $$
begin
  drop trigger if exists stamp_task_created_by on public.tasks;
  create trigger stamp_task_created_by
    before insert or update on public.tasks
    for each row execute function public.stamp_created_by();

  drop trigger if exists stamp_project_created_by on public.projects;
  create trigger stamp_project_created_by
    before insert or update on public.projects
    for each row execute function public.stamp_created_by();
end
$$;

-- ---------------------------------------------------------------------------
-- Realtime (logical replication for live cross-device updates)
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['tasks', 'subtasks', 'settings', 'profile', 'areas', 'projects', 'project_members']
  loop
    if not exists (
      select 1
      from pg_publication p
      join pg_publication_rel r on r.prpubid = p.oid
      where p.pubname = 'supabase_realtime'
        and r.prrelid = format('public.%I', t)::regclass
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end
$$;
