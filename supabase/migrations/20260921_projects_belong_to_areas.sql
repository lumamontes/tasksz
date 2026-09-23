-- Projects are organized under one private Area for the owning account.
-- Existing projects remain valid without an Area until the user assigns one.
alter table public.projects add column if not exists area_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_area_id_fkey'
  ) then
    alter table public.projects
      add constraint projects_area_id_fkey
      foreign key (area_id) references public.areas(id) on delete set null;
  end if;
end $$;

create index if not exists projects_area_id_idx on public.projects(area_id);
