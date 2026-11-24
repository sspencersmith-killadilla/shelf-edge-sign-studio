create table public.libraries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  join_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
create table public.library_members (
  library_id uuid not null references public.libraries(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member' check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (library_id, user_id)
);
create table public.shared_signs (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.libraries(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  config jsonb not null,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
grant select on public.libraries to authenticated;
grant select, delete on public.library_members to authenticated;
grant select, insert, delete on public.shared_signs to authenticated;
grant all on public.libraries, public.library_members, public.shared_signs to service_role;
alter table public.libraries enable row level security;
alter table public.library_members enable row level security;
alter table public.shared_signs enable row level security;

create or replace function public.is_library_member(_lib uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.library_members where library_id = _lib and user_id = auth.uid())
$$;
create or replace function public.is_library_owner(_lib uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.library_members where library_id = _lib and user_id = auth.uid() and role = 'owner')
$$;

create policy "members read library" on public.libraries for select to authenticated using (public.is_library_member(id));
create policy "members read membership" on public.library_members for select to authenticated using (public.is_library_member(library_id));
create policy "leave or owner removes" on public.library_members for delete to authenticated using (user_id = auth.uid() or public.is_library_owner(library_id));
create policy "members read signs" on public.shared_signs for select to authenticated using (public.is_library_member(library_id));
create policy "members add signs" on public.shared_signs for insert to authenticated with check (public.is_library_member(library_id) and created_by = auth.uid());
create policy "author or owner deletes" on public.shared_signs for delete to authenticated using (created_by = auth.uid() or public.is_library_owner(library_id));

create or replace function public.create_library(_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare _id uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  insert into public.libraries(name, created_by) values (trim(_name), auth.uid()) returning id into _id;
  insert into public.library_members(library_id, user_id, role) values (_id, auth.uid(), 'owner');
  return _id;
end $$;
create or replace function public.join_library(_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare _id uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select id into _id from public.libraries where join_code = upper(trim(_code));
  if _id is null then raise exception 'No library with that code'; end if;
  insert into public.library_members(library_id, user_id) values (_id, auth.uid()) on conflict do nothing;
  return _id;
end $$;
revoke execute on function public.create_library(text), public.join_library(text) from public, anon;
grant execute on function public.create_library(text), public.join_library(text) to authenticated;