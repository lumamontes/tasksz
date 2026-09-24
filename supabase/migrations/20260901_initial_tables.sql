-- Bootstrap the tables expected by the additive migrations that follow.
-- Existing installations keep their rows because every statement is additive.

create table if not exists public.projects (
  id text primary key,
  owner_id text not null,
  created_by text,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  _modified timestamptz not null default now(),
  _deleted boolean not null default false
);

create table if not exists public.project_members (
  project_id text not null references public.projects(id) on delete cascade,
  user_id text not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.tasks (
  id text primary key,
  account_id text not null,
  created_by text,
  project_id text references public.projects(id),
  assignee_id text,
  title text not null,
  description text not null default '',
  created_at text not null,
  sort_order numeric not null default 0,
  archived boolean not null default false,
  scheduled_date text,
  start_date text,
  end_date text,
  recurring text,
  _modified timestamptz not null default now(),
  _deleted boolean not null default false
);

create table if not exists public.subtasks (
  id text primary key,
  account_id text not null,
  task_id text not null,
  title text not null,
  description text not null default '',
  done boolean not null default false,
  sort_order numeric not null default 0,
  _modified timestamptz not null default now(),
  _deleted boolean not null default false
);

create table if not exists public.areas (
  id text primary key,
  account_id text not null,
  name text not null,
  description text not null default '',
  color text,
  sort_order numeric not null default 0,
  created_at text not null,
  _modified timestamptz not null default now(),
  _deleted boolean not null default false
);

create table if not exists public.settings (
  id text primary key,
  account_id text not null,
  theme_id text not null default 'calm-beige',
  custom_palette text,
  font_id text not null default 'system',
  font_scale text not null default 'md',
  density text not null default 'cozy',
  show_progress_bars boolean not null default true,
  reduce_motion boolean not null default false,
  sound_enabled boolean not null default false,
  pomodoro_sound text not null default 'none',
  sound_volume numeric not null default 0.6,
  tick_sound_enabled boolean not null default false,
  focus_mode_enabled boolean not null default false,
  celebrations_enabled boolean not null default false,
  pomodoro text,
  _modified timestamptz not null default now(),
  _deleted boolean not null default false
);

create table if not exists public.profile (
  id text primary key,
  account_id text not null,
  name text not null default '',
  _modified timestamptz not null default now(),
  _deleted boolean not null default false
);
