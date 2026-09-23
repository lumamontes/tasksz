-- Additive migration for private Areas and explicit task completion.
-- Existing rows remain valid and unassigned.

begin;

alter table public.tasks add column if not exists completed boolean;
alter table public.tasks add column if not exists start_date text;
alter table public.tasks add column if not exists end_date text;

alter table public.projects add column if not exists description text not null default '';
alter table public.projects add column if not exists _modified timestamptz not null default now();
alter table public.projects add column if not exists _deleted boolean not null default false;

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

create or replace function public.set_modified_timestamp()
returns trigger
language plpgsql
as $$
begin
  new._modified = now();
  return new;
end;
$$;

drop trigger if exists set_modified_trigger on public.areas;
create trigger set_modified_trigger
before update on public.areas
for each row execute function public.set_modified_timestamp();

drop trigger if exists set_modified_trigger on public.projects;
create trigger set_modified_trigger
before update on public.projects
for each row execute function public.set_modified_timestamp();

do $$
begin
  if not exists (
    select 1 from pg_publication p
    join pg_publication_rel r on r.prpubid = p.oid
    where p.pubname = 'supabase_realtime'
      and r.prrelid = 'public.areas'::regclass
  ) then
    alter publication supabase_realtime add table public.areas;
  end if;
end
$$;

commit;
