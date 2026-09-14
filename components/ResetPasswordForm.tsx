"use client";
import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeUp, staggerContainer, reducedTransition } from "@/lib/motion";
import { isValidPassword, PASSWORD_REQUIREMENT_MSG } from "@/lib/auth-validation";

type State = "idle" | "loading" | "success" | "error" | "expired" | "resent";

const inputGlow =
  "focus-visible:shadow-[0_0_0_4px_var(--bronze-glow)] focus-visible:border-[var(--bronze)]";

// Mismo patrón que ConfirmAccount.tsx: el link de recuperación no hace nada
// hasta que el usuario escribe su nueva contraseña y envía el formulario —
// así un escáner de correo que visite el link no gasta el token.
function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function ResetPasswordForm() {
  const reduce = useReducedMotion();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");

  // Un solo cliente/sesión por carga de página: verifyOtp consume el
  // token_hash, así que si updateUser falla después (contraseña igual a la
  // anterior, rate limit, etc.) un reintento debe reusar la sesión ya
  // verificada en vez de volver a llamar verifyOtp con un token ya gastado
  // (eso lo mandaría a "expired" sin que el token sea el problema real).
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const verifiedRef = useRef(false);
  const accessTokenRef = useRef<string | null>(null);

  function getClient() {
    if (!supabaseRef.current) {
      supabaseRef.current = getBrowserSupabase();
    }
    return supabaseRef.current;
  }

  async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
    ]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    if (!tokenHash || type !== "recovery") {
      setState("expired");
      return;
    }
    if (!isValidPassword(password)) {
      setState("error");
      setMsg(PASSWORD_REQUIREMENT_MSG);
      return;
    }
    if (password !== confirm) {
      setState("error");
      setMsg("Las contraseñas no coinciden.");
      return;
    }

    setState("loading");
    const supabase = getClient();
    try {
      if (!verifiedRef.current) {
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (verifyError || !verifyData.session) {
          setState("expired");
          return;
        }
        verifiedRef.current = true;
        accessTokenRef.current = verifyData.session.access_token;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setState("error");
        setMsg(updateError.message || "No pudimos actualizar tu contraseña. Intenta de nuevo.");
        return;
      }

      try {
        await withTimeout(supabase.auth.signOut({ scope: "others" }), 4000);
      } catch {
        // best-effort: no bloquea el flujo si falla o tarda demasiado
      }
      try {
        await fetch("/api/auth/notify-password-changed", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${accessTokenRef.current}`,
          },
          signal: AbortSignal.timeout(4000),
        });
      } catch {
        // best-effort: no bloquea el flujo si falla o tarda demasiado
      }

      setState("success");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1400);
    } catch {
      setState("error");
      setMsg("Revisa tu conexión e intenta de nuevo.");
    }
  }

  async function onResend() {
    if (!email) return;
    setState("loading");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setState("error");
        setMsg(json.error ?? "No pudimos enviar el enlace.");
        return;
      }
      setState("resent");
    } catch {
      setState("error");
      setMsg("Revisa tu conexión e intenta de nuevo.");
    }
  }

  if (state === "success") {
    return (
      <motion.div
        role="status"
        className="flex flex-col items-center gap-3 py-4 text-center"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedTransition(reduce, 0, 0.45)}
      >
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          ¡Contraseña actualizada!
        </h1>
        <p className="text-[var(--text-secondary)]">Te llevamos a iniciar sesión…</p>
      </motion.div>
    );
  }

  if (state === "expired") {
    return (
      <motion.div
        role="status"
        className="flex flex-col items-center gap-4 py-4 text-center"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedTransition(reduce, 0, 0.45)}
      >
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Enlace expirado
        </h1>
        <p className="text-[var(--text-secondary)]">
          Este enlace ya expiró o fue usado. Pide uno nuevo para continuar.
        </p>
        {email && (
          <Button type="button" onClick={onResend} className="min-h-11 w-full">
            Enviar enlace nuevo
          </Button>
        )}
      </motion.div>
    );
  }

  if (state === "resent") {
    return (
      <motion.div
        role="status"
        className="flex flex-col items-center gap-3 py-4 text-center"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedTransition(reduce, 0, 0.45)}
      >
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Te enviamos un nuevo enlace
        </h1>
        <p className="text-[var(--text-secondary)]">
          Revisa tu correo y sigue el enlace para continuar.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      className="flex w-full max-w-md flex-col gap-3"
      noValidate
      variants={staggerContainer}
      initial={reduce ? false : "hidden"}
      animate="visible"
    >
      <motion.div variants={fadeUp} className="mb-2">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Elige tu nueva contraseña
        </h1>
        <div className="mt-2 h-0.5 w-10 rounded-full bg-[var(--bronze)]" aria-hidden />
      </motion.div>
      <motion.div variants={fadeUp}>
        <Input
          type="password"
          required
          placeholder="Nueva contraseña"
          aria-label="Nueva contraseña"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`min-h-11 ${inputGlow}`}
        />
      </motion.div>
      <motion.div variants={fadeUp}>
        <Input
          type="password"
          required
          placeholder="Confirma la contraseña"
          aria-label="Confirma la contraseña"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={`min-h-11 ${inputGlow}`}
        />
      </motion.div>
      <motion.div variants={fadeUp}>
        <motion.div
          whileHover={reduce ? undefined : { scale: 1.02 }}
          whileTap={reduce ? undefined : { scale: 0.98 }}
        >
          <Button
            type="submit"
            disabled={state === "loading"}
            aria-busy={state === "loading"}
            className="min-h-11 w-full"
          >
            {state === "loading" ? "Cambiando…" : "Cambiar contraseña"}
          </Button>
        </motion.div>
      </motion.div>
      <motion.p
        role="alert"
        aria-live="polite"
        animate={state === "error" && !reduce ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={reducedTransition(reduce, 0, 0.4)}
        className="min-h-5 text-sm text-[var(--terracotta)]"
      >
        {state === "error" ? msg : ""}
      </motion.p>
    </motion.form>
  );
}
