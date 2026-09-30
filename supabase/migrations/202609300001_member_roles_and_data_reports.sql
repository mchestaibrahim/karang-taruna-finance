create or replace function public.has_finance_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pengurus_roles
    where user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

revoke all on function public.has_finance_role(text[]) from public;
grant execute on function public.has_finance_role(text[]) to authenticated;

alter table public.pengurus_roles
  drop constraint if exists pengurus_roles_role_check;

alter table public.pengurus_roles
  add constraint pengurus_roles_role_check
  check (role = any (array['bendahara'::text, 'pengurus'::text, 'member'::text]));

create or replace function public.block_member_finance_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.has_finance_role(array['member']) then
    raise exception 'Member accounts are read-only for financial data'
      using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.block_member_finance_writes() from public;

create trigger members_block_member_writes
before insert or update or delete on public.members
for each row execute function public.block_member_finance_writes();

create trigger transactions_block_member_writes
before insert or update or delete on public.transactions
for each row execute function public.block_member_finance_writes();

create trigger expenses_block_member_writes
before insert or update or delete on public.expenses
for each row execute function public.block_member_finance_writes();

create trigger other_income_block_member_writes
before insert or update or delete on public.other_income
for each row execute function public.block_member_finance_writes();

create trigger carwash_allocations_block_member_writes
before insert or update or delete on public.carwash_allocations
for each row execute function public.block_member_finance_writes();

create or replace function public.guard_pengurus_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and current_setting('app.assign_member_role', true) is distinct from 'on' then
    raise exception 'Role assignments must be performed by a trusted administrator'
      using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger pengurus_roles_guard_member_changes
before insert or update or delete on public.pengurus_roles
for each row execute function public.guard_pengurus_roles();

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
where not exists (select 1 from public.pengurus_roles role where role.user_id = link.user_id)
on conflict (user_id) do nothing;

create table if not exists public.data_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  record_table text not null check (record_table in ('transactions', 'expenses', 'other_income', 'members')),
  record_id text not null,
  record_label text not null,
  report_type text not null check (report_type in ('nominal', 'description', 'date', 'duplicate', 'mismatch', 'other')),
  description text not null check (length(trim(description)) > 0),
  additional_note text,
  status text not null default 'pending' check (status in ('pending', 'reviewed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

create index if not exists data_reports_status_created_at_idx
  on public.data_reports (status, created_at desc);

alter table public.data_reports enable row level security;
grant select, insert, update on public.data_reports to authenticated;

drop policy if exists data_reports_select_member_or_treasurer on public.data_reports;
create policy data_reports_select_member_or_treasurer
on public.data_reports for select to authenticated
using (
  (public.has_finance_role(array['member']) and reporter_id = auth.uid())
  or public.has_finance_role(array['bendahara'])
);

drop policy if exists data_reports_insert_member on public.data_reports;
create policy data_reports_insert_member
on public.data_reports for insert to authenticated
with check (
  public.has_finance_role(array['member'])
  and reporter_id = auth.uid()
  and status = 'pending'
  and reviewed_at is null
  and reviewed_by is null
);

drop policy if exists data_reports_update_treasurer on public.data_reports;
create policy data_reports_update_treasurer
on public.data_reports for update to authenticated
using (public.has_finance_role(array['bendahara']))
with check (public.has_finance_role(array['bendahara']));

grant select on public.members, public.transactions, public.expenses,
  public.other_income, public.carwash_allocations to authenticated;

drop policy if exists finance_read_assigned_roles on public.members;
create policy finance_read_assigned_roles on public.members for select to authenticated
using (public.has_finance_role(array['member', 'bendahara', 'pengurus']));

drop policy if exists finance_read_assigned_roles on public.transactions;
create policy finance_read_assigned_roles on public.transactions for select to authenticated
using (public.has_finance_role(array['member', 'bendahara', 'pengurus']));

drop policy if exists finance_read_assigned_roles on public.expenses;
create policy finance_read_assigned_roles on public.expenses for select to authenticated
using (public.has_finance_role(array['member', 'bendahara', 'pengurus']));

drop policy if exists finance_read_assigned_roles on public.other_income;
create policy finance_read_assigned_roles on public.other_income for select to authenticated
using (public.has_finance_role(array['member', 'bendahara', 'pengurus']));

drop policy if exists finance_read_assigned_roles on public.carwash_allocations;
create policy finance_read_assigned_roles on public.carwash_allocations for select to authenticated
using (public.has_finance_role(array['member', 'bendahara', 'pengurus']));
