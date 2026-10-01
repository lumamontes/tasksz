-- Bring the migration path in line with supabase/schema.sql.
-- The original bootstrap migration created tables but did not secure or publish
-- them, which made a fresh Supabase install behave differently from the schema
-- reference file.

begin;

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.settings enable row level security;
alter table public.profile enable row level security;
alter table public.areas enable row level security;

create or replace function public.is_project_member(target_project_id text, target_user_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.project_members where project_id = target_project_id and user_id = target_user_id);
$$;

create or replace function public.is_project_owner(target_project_id text, target_user_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.projects where id = target_project_id and owner_id = target_user_id);
$$;

revoke all on function public.is_project_member(text, text) from public;
revoke all on function public.is_project_owner(text, text) from public;
grant execute on function public.is_project_member(text, text) to authenticated;
grant execute on function public.is_project_owner(text, text) to authenticated;

drop policy if exists "project members can read projects" on public.projects;
create policy "project members can read projects" on public.projects for select
  using (auth.uid()::text = owner_id or public.is_project_member(id, auth.uid()::text));
drop policy if exists "users can create projects" on public.projects;
create policy "users can create projects" on public.projects for insert
  with check (auth.uid()::text = owner_id and coalesce(created_by, auth.uid()::text) = auth.uid()::text);
drop policy if exists "project owners can update projects" on public.projects;
create policy "project owners can update projects" on public.projects for update
  using (auth.uid()::text = owner_id) with check (auth.uid()::text = owner_id);

drop policy if exists "project members can read membership" on public.project_members;
create policy "project members can read membership" on public.project_members for select
  using (user_id = auth.uid()::text or public.is_project_owner(project_id, auth.uid()::text));
drop policy if exists "project owners can manage membership" on public.project_members;
create policy "project owners can manage membership" on public.project_members for all
  using (public.is_project_owner(project_id, auth.uid()::text))
  with check (public.is_project_owner(project_id, auth.uid()::text));

drop policy if exists "users can read own tasks" on public.tasks;
create policy "users can read own tasks" on public.tasks for select
  using (auth.uid()::text = account_id or public.is_project_member(project_id, auth.uid()::text));
drop policy if exists "users can insert own tasks" on public.tasks;
create policy "users can insert own tasks" on public.tasks for insert
  with check (
    auth.uid()::text = account_id
    and coalesce(created_by, auth.uid()::text) = auth.uid()::text
    and (project_id is null or auth.uid()::text = (select owner_id from public.projects where id = project_id) or public.is_project_member(project_id, auth.uid()::text))
  );
drop policy if exists "users can update own tasks" on public.tasks;
create policy "users can update own tasks" on public.tasks for update
  using (auth.uid()::text = account_id)
  with check (
    auth.uid()::text = account_id
    and (project_id is null or auth.uid()::text = (select owner_id from public.projects where id = project_id) or public.is_project_member(project_id, auth.uid()::text))
  );

drop policy if exists "users can read own subtasks" on public.subtasks;
create policy "users can read own subtasks" on public.subtasks for select using (auth.uid()::text = account_id);
drop policy if exists "users can insert own subtasks" on public.subtasks;
create policy "users can insert own subtasks" on public.subtasks for insert with check (
  auth.uid()::text = account_id
  and exists (select 1 from public.tasks where id = task_id and account_id = auth.uid()::text)
);
drop policy if exists "users can update own subtasks" on public.subtasks;
create policy "users can update own subtasks" on public.subtasks for update
  using (auth.uid()::text = account_id)
  with check (
    auth.uid()::text = account_id
    and exists (select 1 from public.tasks where id = task_id and account_id = auth.uid()::text)
  );

do $$
declare table_name text;
begin
  foreach table_name in array array['settings', 'profile'] loop
    execute format('drop policy if exists "users can read own %1$s" on public.%1$I', table_name);
    execute format('create policy "users can read own %1$s" on public.%1$I for select using (auth.uid()::text = account_id)', table_name);
    execute format('drop policy if exists "users can insert own %1$s" on public.%1$I', table_name);
    execute format('create policy "users can insert own %1$s" on public.%1$I for insert with check (auth.uid()::text = account_id)', table_name);
    execute format('drop policy if exists "users can update own %1$s" on public.%1$I', table_name);
    execute format('create policy "users can update own %1$s" on public.%1$I for update using (auth.uid()::text = account_id) with check (auth.uid()::text = account_id)', table_name);
  end loop;
end $$;

drop policy if exists "users can read own areas" on public.areas;
create policy "users can read own areas" on public.areas for select using (auth.uid()::text = account_id);
drop policy if exists "users can insert own areas" on public.areas;
create policy "users can insert own areas" on public.areas for insert with check (auth.uid()::text = account_id);
drop policy if exists "users can update own areas" on public.areas;
create policy "users can update own areas" on public.areas for update using (auth.uid()::text = account_id) with check (auth.uid()::text = account_id);

create or replace function public.validate_project_area_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.area_id is not null and not exists (
    select 1 from public.areas where id = new.area_id and account_id = new.owner_id
  ) then
    raise exception 'project area must belong to project owner';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_project_area_owner on public.projects;
create trigger validate_project_area_owner before insert or update of area_id, owner_id on public.projects
for each row execute function public.validate_project_area_owner();

do $$
declare table_name text;
begin
  foreach table_name in array array['tasks', 'subtasks', 'settings', 'profile', 'areas', 'projects', 'project_members'] loop
    if not exists (
      select 1 from pg_publication p join pg_publication_rel r on r.prpubid = p.oid
      where p.pubname = 'supabase_realtime' and r.prrelid = format('public.%I', table_name)::regclass
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;

commit;
