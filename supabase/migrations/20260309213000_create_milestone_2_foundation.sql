create extension if not exists pgcrypto;

create type public.organization_type as enum ('clinic', 'center');
create type public.staff_role as enum ('clinic-dusw', 'clinic-nephrologist', 'front-desk');
create type public.case_stage as enum ('new-referral', 'patient-onboarding', 'initial-todos');

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.organization_type not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  email text not null unique,
  full_name text not null,
  role public.staff_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text not null,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'es')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique,
  patient_id uuid not null references public.patients (id) on delete restrict,
  referring_clinic_id uuid not null references public.organizations (id) on delete restrict,
  submitted_by_role public.staff_role not null,
  stage public.case_stage not null default 'new-referral',
  stage_entered_at timestamptz not null default now(),
  referral_submitted_at timestamptz not null default now(),
  invite_link_generated_at timestamptz,
  dusw_contact_name text not null,
  dusw_contact_email text not null,
  nephrologist_contact_name text not null,
  nephrologist_contact_email text not null,
  sms_consent boolean not null default false,
  email_consent boolean not null default false,
  roi_form_1_signed_at timestamptz,
  roi_form_2_signed_at timestamptz,
  roi_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cases_submitted_by_role_check
    check (submitted_by_role in ('clinic-dusw', 'clinic-nephrologist')),
  constraint cases_roi_form_2_requires_form_1_check
    check (roi_form_2_signed_at is null or roi_form_1_signed_at is not null),
  constraint cases_roi_completed_requires_both_forms_check
    check (
      roi_completed_at is null
      or (roi_form_1_signed_at is not null and roi_form_2_signed_at is not null)
    ),
  constraint cases_initial_todos_requires_roi_completion_check
    check (
      stage <> 'initial-todos'
      or (
        roi_form_1_signed_at is not null
        and roi_form_2_signed_at is not null
        and roi_completed_at is not null
      )
    )
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  event_type text not null,
  actor_type text not null check (actor_type in ('system', 'staff', 'patient')),
  actor_id uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_organization_id on public.profiles (organization_id);
create index idx_patients_auth_user_id on public.patients (auth_user_id);
create index idx_cases_patient_id on public.cases (patient_id);
create index idx_cases_referring_clinic_id on public.cases (referring_clinic_id);
create index idx_cases_stage on public.cases (stage);
create index idx_cases_stage_created_at on public.cases (stage, created_at desc);
create index idx_audit_events_case_id on public.audit_events (case_id);
create index idx_audit_events_event_type on public.audit_events (event_type);
create index idx_audit_events_created_at on public.audit_events (created_at desc);

create trigger organizations_set_updated_at
before update on public.organizations
for each row
execute function public.update_updated_at_column();

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

create trigger patients_set_updated_at
before update on public.patients
for each row
execute function public.update_updated_at_column();

create trigger cases_set_updated_at
before update on public.cases
for each row
execute function public.update_updated_at_column();

create trigger audit_events_set_updated_at
before update on public.audit_events
for each row
execute function public.update_updated_at_column();

create or replace function public.current_staff_role()
returns public.staff_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.current_staff_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.organization_id
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.current_patient_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.patients p
  where p.auth_user_id = auth.uid()
$$;

grant execute on function public.current_staff_role() to authenticated;
grant execute on function public.current_staff_org_id() to authenticated;
grant execute on function public.current_patient_id() to authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role_text text;
  new_org_id_text text;
  new_role public.staff_role;
  new_org_id uuid;
begin
  new_role_text := nullif(
    coalesce(new.raw_app_meta_data ->> 'role', new.raw_user_meta_data ->> 'role'),
    ''
  );

  new_org_id_text := nullif(
    coalesce(
      new.raw_app_meta_data ->> 'organization_id',
      new.raw_user_meta_data ->> 'organization_id'
    ),
    ''
  );

  if new_role_text in ('clinic-dusw', 'clinic-nephrologist', 'front-desk')
    and new_org_id_text is not null then
    new_role := new_role_text::public.staff_role;
    new_org_id := new_org_id_text::uuid;

    insert into public.profiles (
      id,
      organization_id,
      email,
      full_name,
      role
    )
    values (
      new.id,
      new_org_id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
      new_role
    )
    on conflict (id) do update
    set
      organization_id = excluded.organization_id,
      email = excluded.email,
      full_name = excluded.full_name,
      role = excluded.role,
      updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.cases enable row level security;
alter table public.audit_events enable row level security;

create policy "organizations_select_for_associated_staff"
on public.organizations
for select
to authenticated
using (
  id = public.current_staff_org_id()
  or (
    public.current_staff_role() = 'front-desk'
    and exists (
      select 1
      from public.cases c
      where c.referring_clinic_id = organizations.id
        and c.stage = 'initial-todos'
    )
  )
);

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "patients_select_own"
on public.patients
for select
to authenticated
using (id = public.current_patient_id());

create policy "patients_select_for_clinic_staff"
on public.patients
for select
to authenticated
using (
  exists (
    select 1
    from public.cases c
    where c.patient_id = patients.id
      and c.referring_clinic_id = public.current_staff_org_id()
      and public.current_staff_role() in ('clinic-dusw', 'clinic-nephrologist')
  )
);

create policy "patients_select_for_front_desk"
on public.patients
for select
to authenticated
using (
  public.current_staff_role() = 'front-desk'
  and exists (
    select 1
    from public.cases c
    where c.patient_id = patients.id
      and c.stage = 'initial-todos'
  )
);

create policy "cases_insert_for_clinic_staff"
on public.cases
for insert
to authenticated
with check (
  public.current_staff_role() in ('clinic-dusw', 'clinic-nephrologist')
  and public.current_staff_org_id() = referring_clinic_id
  and submitted_by_role = public.current_staff_role()
);

create policy "cases_select_for_clinic_staff"
on public.cases
for select
to authenticated
using (
  public.current_staff_role() in ('clinic-dusw', 'clinic-nephrologist')
  and public.current_staff_org_id() = referring_clinic_id
);

create policy "cases_select_for_patient"
on public.cases
for select
to authenticated
using (patient_id = public.current_patient_id());

create policy "cases_select_for_front_desk"
on public.cases
for select
to authenticated
using (
  public.current_staff_role() = 'front-desk'
  and stage = 'initial-todos'
);

create policy "audit_events_select_for_clinic_staff"
on public.audit_events
for select
to authenticated
using (
  exists (
    select 1
    from public.cases c
    where c.id = audit_events.case_id
      and c.referring_clinic_id = public.current_staff_org_id()
      and public.current_staff_role() in ('clinic-dusw', 'clinic-nephrologist')
  )
);

create policy "audit_events_select_for_patient"
on public.audit_events
for select
to authenticated
using (
  exists (
    select 1
    from public.cases c
    where c.id = audit_events.case_id
      and c.patient_id = public.current_patient_id()
  )
);

create policy "audit_events_select_for_front_desk"
on public.audit_events
for select
to authenticated
using (
  public.current_staff_role() = 'front-desk'
  and exists (
    select 1
    from public.cases c
    where c.id = audit_events.case_id
      and c.stage = 'initial-todos'
  )
);

insert into public.organizations (id, name, type)
values
  ('00000000-0000-0000-0000-000000000101', 'Milestone 2 Clinic', 'clinic'),
  ('00000000-0000-0000-0000-000000000102', 'Milestone 2 Center', 'center')
on conflict (id) do update
set
  name = excluded.name,
  type = excluded.type,
  updated_at = now();

-- Staff auth bootstrap for this milestone is handled by:
--   npm run seed:staff
-- using NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
-- and optional SEED_CLINIC_PASSWORD / SEED_FRONT_DESK_PASSWORD.
-- The auth trigger above creates matching rows in public.profiles for new users.
