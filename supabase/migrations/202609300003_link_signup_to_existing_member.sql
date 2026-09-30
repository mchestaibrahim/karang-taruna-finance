create table if not exists public.member_auth_links (
  member_id bigint primary key references public.members(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  linked_at timestamptz not null default now()
);

create unique index if not exists member_auth_links_email_lower_uidx
  on public.member_auth_links (lower(email));

alter table public.member_auth_links enable row level security;
grant select on public.member_auth_links to authenticated;

drop policy if exists member_auth_links_select_own_or_treasurer on public.member_auth_links;
create policy member_auth_links_select_own_or_treasurer
on public.member_auth_links for select to authenticated
using (user_id = auth.uid() or public.has_finance_role(array['bendahara']));

create or replace function public.assign_default_member_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_name text := nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '');
  normalized_email text := lower(btrim(new.email));
  matching_member_id bigint;
  matching_count bigint;
begin
  if requested_name is null then
    raise exception 'An existing member name is required';
  end if;

  select count(*), min(id)
  into matching_count, matching_member_id
  from public.members
  where active is true
    and lower(btrim(name)) = lower(requested_name);

  if matching_count = 0 then
    raise exception 'No active member matches the submitted name';
  elsif matching_count > 1 then
    raise exception 'The member name is ambiguous; contact the treasurer';
  end if;

  perform set_config('app.assign_member_role', 'on', true);
  begin
    insert into public.member_auth_links (member_id, user_id, email)
    values (matching_member_id, new.id, normalized_email);
  exception when unique_violation then
    raise exception 'This member or email is already linked to an account';
  end;

  insert into public.pengurus_roles (user_id, role)
  values (new.id, 'member')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.assign_default_member_role() from public;

drop trigger if exists assign_default_member_role on auth.users;
create trigger assign_default_member_role
after insert on auth.users
for each row execute function public.assign_default_member_role();

with named_matches as (
  select auth_user.id as user_id,
    lower(btrim(auth_user.email)) as email,
    member.id as member_id,
    count(*) over (partition by auth_user.id) as match_count
  from auth.users auth_user
  join public.members member
    on member.active is true
   and lower(btrim(member.name)) = lower(btrim(auth_user.raw_user_meta_data ->> 'full_name'))
  where nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), '') is not null
    and auth_user.email is not null
    and not exists (
      select 1 from public.pengurus_roles role where role.user_id = auth_user.id
    )
)
insert into public.member_auth_links (member_id, user_id, email)
select member_id, user_id, email
from named_matches candidate
where candidate.match_count = 1
  and not exists (
    select 1 from public.member_auth_links link
    where link.member_id = candidate.member_id or link.user_id = candidate.user_id
  )
on conflict do nothing;

insert into public.pengurus_roles (user_id, role)
select link.user_id, 'member'
from public.member_auth_links link
where not exists (
  select 1 from public.pengurus_roles role where role.user_id = link.user_id
)
on conflict (user_id) do nothing;
