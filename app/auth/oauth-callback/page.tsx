"use client";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { AuthCard } from "@/components/ui/AuthCard";
import { AuthAmbient } from "@/components/ui/AuthAmbient";

type BusinessRow = { needs_onboarding: boolean };

export default function OAuthCallbackPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const supabase = getBrowserSupabase();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (cancelled) return;
        if (sessionError || !sessionData.session) {
          setFailed(true);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("businesses(needs_onboarding)")
          .eq("user_id", sessionData.session.user.id)
          .single();
        if (cancelled) return;
        if (profileError || !profile) {
          setFailed(true);
          return;
        }

        const business = (profile as { businesses: BusinessRow | BusinessRow[] }).businesses;
        const needsOnboarding = Array.isArray(business) ? business[0]?.needs_onboarding : business?.needs_onboarding;

        if (needsOnboarding) {
          window.location.href = "/auth/complete-profile";
          return;
        }

        const appUrl = process.env.NEXT_PUBLIC_AUREO_APP_URL;
        const { access_token, refresh_token } = sessionData.session;
        window.location.href = `${appUrl}/index.html#access_token=${encodeURIComponent(
          access_token
        )}&refresh_token=${encodeURIComponent(refresh_token)}`;
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <AuthAmbient>
        <AuthCard>
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              No pudimos iniciar sesión
            </h1>
            <p className="text-[var(--text-secondary)]">
              Intenta de nuevo o usa tu correo y contraseña.
            </p>
            <a href="/login" className="text-sm text-[var(--bronze)] underline underline-offset-2">
              Volver a iniciar sesión
            </a>
          </div>
        </AuthCard>
      </AuthAmbient>
    );
  }

  return (
    <AuthAmbient>
      <AuthCard>
        <div role="status" className="flex flex-col items-center gap-3 py-4 text-center">
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Entrando…</h1>
        </div>
      </AuthCard>
    </AuthAmbient>
  );
}
