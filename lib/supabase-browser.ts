import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente de navegador con persistencia de sesión (a diferencia del cliente
// efímero que usan ConfirmAccount.tsx/ResetPasswordForm.tsx): el flujo de
// OAuth redirige la página completa a Google y de vuelta, así que la sesión
// tiene que sobrevivir esa navegación — se apoya en el storage por defecto
// de supabase-js (persistSession/detectSessionInUrl ambos true).
let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    client = createClient(url, key);
  }
  return client;
}
