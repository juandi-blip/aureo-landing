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
