"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aureo.com.co";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.48c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.89c2.28-2.1 3.55-5.2 3.55-8.84z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.89-3.02c-1.08.72-2.46 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.11C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.29 14.29A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.39-2.29V6.6H1.28A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.28 5.4z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.6l4.01 3.11C6.23 6.87 8.88 4.75 12 4.75z" />
    </svg>
  );
}

export function GoogleAuthButton() {
  const reduce = useReducedMotion();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    const supabase = getBrowserSupabase();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${SITE_URL}/auth/oauth-callback` },
    });
    // No further state update needed on success — signInWithOAuth navigates
    // the whole page away to Google. `loading` only matters if it fails
    // without navigating, which the browser surfaces as a normal rejection
    // Supabase already logs; nothing actionable to show the user here that
    // a retry click wouldn't already fix.
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading}
      whileHover={reduce ? undefined : { scale: 1.02 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)] disabled:opacity-60"
    >
      <GoogleIcon />
      Continuar con Google
    </motion.button>
  );
}
