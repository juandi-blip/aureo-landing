import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan variables de entorno de Supabase.");
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

// Cliente con la anon key: usado por las rutas de auth (signup/login) para
// llamar a supabase.auth.* — estas operaciones están diseñadas para correr
// con la anon key, no con la service role key (que bypasea Auth por completo).
export function getSupabaseAnon(): SupabaseClient {
  if (anonClient) return anonClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Faltan variables de entorno de Supabase (anon key).");
  }
  anonClient = createClient(url, key, { auth: { persistSession: false } });
  return anonClient;
}
