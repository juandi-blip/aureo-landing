"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { fadeUp, staggerContainer, reducedTransition } from "@/lib/motion";

type State = "idle" | "loading" | "success" | "error" | "resent";

// Cliente de navegador: el link de confirmación solo llega hasta aquí (una
// página normal, sin efectos). El token no se consume hasta que el usuario
// hace clic en el botón y este código llama a verifyOtp — así un escáner de
// correo que visita el link (muy común cuando cae en spam) ya no invalida
// el token antes de que el usuario confirme de verdad.
function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function ConfirmAccount() {
  const reduce = useReducedMotion();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const email = searchParams.get("email");

  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");

  async function onConfirm() {
    if (!tokenHash || (type !== "signup" && type !== "email")) {
      setState("error");
      setMsg("Este enlace de confirmación no es válido.");
      return;
    }
    setState("loading");
    setMsg("");
    const supabase = getBrowserSupabase();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "signup",
    });
    if (error) {
      setState("error");
      setMsg("Este enlace ya expiró o fue usado.");
      return;
    }
    setState("success");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1400);
  }

  async function onResend() {
    if (!email) return;
    setState("loading");
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setState("error");
        setMsg(json.error ?? "No pudimos reenviar el correo.");
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
          ¡Cuenta confirmada!
        </h1>
        <p className="text-[var(--text-secondary)]">Te llevamos a iniciar sesión…</p>
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
          Te enviamos un nuevo correo
        </h1>
        <p className="text-[var(--text-secondary)]">
          Ábrelo y dale clic al botón de confirmar en cuanto llegue.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-4 text-center"
      variants={staggerContainer}
      initial={reduce ? false : "hidden"}
      animate="visible"
    >
      <motion.div variants={fadeUp}>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Confirma tu cuenta
        </h1>
        <div className="mx-auto mt-2 h-0.5 w-10 rounded-full bg-[var(--bronze)]" aria-hidden />
        <p className="mt-3 text-[var(--text-secondary)]">
          Un último paso: confirma tu correo para activar tu prueba gratuita.
        </p>
      </motion.div>
      <motion.div variants={fadeUp}>
        <motion.div
          whileHover={reduce ? undefined : { scale: 1.02 }}
          whileTap={reduce ? undefined : { scale: 0.98 }}
        >
          <Button
            type="button"
            onClick={onConfirm}
            disabled={state === "loading"}
            aria-busy={state === "loading"}
            className="min-h-11 w-full"
          >
            {state === "loading" ? "Confirmando…" : "Confirmar mi cuenta"}
          </Button>
        </motion.div>
      </motion.div>
      <motion.p
        role="alert"
        aria-live="polite"
        variants={fadeUp}
        className="min-h-5 text-sm text-[var(--terracotta)]"
      >
        {state === "error" ? msg : ""}
      </motion.p>
      {state === "error" && email && (
        <motion.button
          type="button"
          variants={fadeUp}
          onClick={onResend}
          className="text-sm text-[var(--bronze)] underline underline-offset-2"
        >
          Reenviar correo de confirmación
        </motion.button>
      )}
    </motion.div>
  );
}
