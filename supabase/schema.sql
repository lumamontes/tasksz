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
--   * column names match the RxDB doc fields exactly (camelCase)
--   * `_modified timestamptz` auto-updated by trigger
--   * `_deleted boolean` for soft deletes (never hard-delete rows)
--   * realtime enabled on every table
--   * RLS scoped to accountId = auth.uid()::text (the app sets accountId on
--     every write when a user is signed in)

-- ---------------------------------------------------------------------------
-- Table: tasks
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id           text primary key,
  "accountId"  text not null,
  title        text not null,
  description  text not null default '',
  "createdAt"  text not null,
  "order"      numeric not null default 0,
  archived     boolean not null default false,
  "scheduledDate" text,
  recurring    text,

  _modified timestamptz not null default now(),
  _deleted  boolean not null default false
);

alter table public.tasks enable row level security;

create policy "users can read own tasks"
  on public.tasks for select
  using (auth.uid()::text = "accountId");

create policy "users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid()::text = "accountId");

create policy "users can update own tasks"
  on public.tasks for update
  using (auth.uid()::text = "accountId")
  with check (auth.uid()::text = "accountId");

-- ---------------------------------------------------------------------------
-- Table: subtasks
-- ---------------------------------------------------------------------------
create table if not exists public.subtasks (
  id          text primary key,
  "accountId" text not null,
  "taskId"    text not null,
  title       text not null,
  description text not null default '',
  done        boolean not null default false,
  "order"     numeric not null default 0,

  _modified timestamptz not null default now(),
  _deleted  boolean not null default false
);

alter table public.subtasks enable row level security;

create policy "users can read own subtasks"
  on public.subtasks for select
  using (auth.uid()::text = "accountId");

create policy "users can insert own subtasks"
  on public.subtasks for insert
  with check (auth.uid()::text = "accountId");

create policy "users can update own subtasks"
  on public.subtasks for update
  using (auth.uid()::text = "accountId")
  with check (auth.uid()::text = "accountId");

-- ---------------------------------------------------------------------------
-- Table: settings (single row per account, id 'default')
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  id             text primary key,
  "accountId"    text not null,
  "themeId"      text not null default 'calm-beige',
  "customPalette" text,
  "fontId"       text not null default 'system',
  "fontScale"    text not null default 'md',
  density        text not null default 'cozy',
  "showProgressBars" boolean not null default true,
  "reduceMotion" boolean not null default false,
  "soundEnabled" boolean not null default false,
  "pomodoroSound" text not null default 'none',
  "soundVolume" numeric not null default 0.6,
  "tickSoundEnabled" boolean not null default false,
  "focusModeEnabled" boolean not null default false,
  "celebrationsEnabled" boolean not null default false,
  pomodoro       text,

  _modified timestamptz not null default now(),
  _deleted  boolean not null default false
);

alter table public.settings enable row level security;

create policy "users can read own settings"
  on public.settings for select
  using (auth.uid()::text = "accountId");

create policy "users can insert own settings"
  on public.settings for insert
  with check (auth.uid()::text = "accountId");

create policy "users can update own settings"
  on public.settings for update
  using (auth.uid()::text = "accountId")
  with check (auth.uid()::text = "accountId");

-- ---------------------------------------------------------------------------
-- Table: profile (single row per account, id 'default')
-- ---------------------------------------------------------------------------
create table if not exists public.profile (
  id        text primary key,
  "accountId" text not null,
  name      text not null default '',

  _modified timestamptz not null default now(),
  _deleted  boolean not null default false
);

alter table public.profile enable row level security;

create policy "users can read own profile"
  on public.profile for select
  using (auth.uid()::text = "accountId");

create policy "users can insert own profile"
  on public.profile for insert
  with check (auth.uid()::text = "accountId");

create policy "users can update own profile"
  on public.profile for update
  using (auth.uid()::text = "accountId")
  with check (auth.uid()::text = "accountId");

-- ---------------------------------------------------------------------------
-- `_modified` auto-update trigger (all tables)
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['tasks', 'subtasks', 'settings', 'profile']
  loop
    execute format($x$
      create trigger set_modified_trigger
      before update on public.%I
      for each row
      execute function extensions.moddatetime('_modified')
    $x$, t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Realtime (logical replication for live cross-device updates)
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.subtasks;
alter publication supabase_realtime add table public.settings;
alter publication supabase_realtime add table public.profile;
