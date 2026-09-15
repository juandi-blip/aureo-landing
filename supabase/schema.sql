-- Ejecutar en el SQL Editor de Supabase
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nombre text,
  negocio text,
  ciudad text,
  origen text,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Sin policies de select públicas: nadie lee la lista desde el cliente.
-- La inserción se hace server-side con la service role key (bypassa RLS),
-- así que NO se necesita policy de insert pública.

-- ============================================================
-- Sub-project B: auth & multi-tenant foundation
-- Ejecutar en el SQL Editor de Supabase (mismo procedimiento que
-- la tabla waitlist de arriba).
-- ============================================================

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan_id text not null check (plan_id in ('starter', 'pro', 'logistica')),
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;

create policy "Users read their own business"
  on public.businesses for select
  using (id in (select business_id from public.profiles where user_id = auth.uid()));

create policy "Users read their own profile"
  on public.profiles for select
  using (user_id = auth.uid());

-- Trigger: al crear un auth.users nuevo, lee business_name/plan_id de
-- raw_user_meta_data (pasados en signUp) y crea business + profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_business_id uuid;
begin
  insert into public.businesses (name, plan_id)
  values (
    coalesce(new.raw_user_meta_data->>'business_name', 'Mi negocio'),
    coalesce(new.raw_user_meta_data->>'plan_id', 'starter')
  )
  returning id into new_business_id;

  insert into public.profiles (user_id, business_id, role)
  values (new.id, new_business_id, 'admin');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Signup/login overhaul: Google OAuth first-login needs a business
-- name/plan the provider never supplies. The trigger below still fires
-- for every new auth.users row (OAuth included) and still inserts a
-- businesses row with placeholder defaults — this just flags rows that
-- need those placeholders corrected via a post-login screen.
-- Ejecutar en el SQL Editor de Supabase (mismo procedimiento que las
-- migraciones de arriba).
-- ============================================================

alter table public.businesses
  add column if not exists needs_onboarding boolean not null default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_business_id uuid;
  is_oauth boolean;
begin
  is_oauth := coalesce(new.raw_app_meta_data->>'provider', 'email') <> 'email';

  insert into public.businesses (name, plan_id, needs_onboarding)
  values (
    coalesce(new.raw_user_meta_data->>'business_name', 'Mi negocio'),
    coalesce(new.raw_user_meta_data->>'plan_id', 'starter'),
    is_oauth
  )
  returning id into new_business_id;

  insert into public.profiles (user_id, business_id, role)
  values (new.id, new_business_id, 'admin');

  return new;
end;
$$;

create policy "Users update their own business"
  on public.businesses for update
  using (id in (select business_id from public.profiles where user_id = auth.uid()))
  with check (id in (select business_id from public.profiles where user_id = auth.uid()));
