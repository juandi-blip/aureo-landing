"use client";
import { useId, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HONEYPOT_FIELD } from "@/lib/validation";
import { fadeUp, staggerContainer, reducedTransition } from "@/lib/motion";

type FormState = "idle" | "loading" | "error" | "check-email";

const PLAN_OPTIONS: { id: "starter" | "pro" | "logistica"; label: string }[] = [
  { id: "starter", label: "Starter" },
  { id: "pro", label: "Pro" },
  { id: "logistica", label: "Logística" },
];

const inputGlow =
  "focus-visible:shadow-[0_0_0_4px_var(--bronze-glow)] focus-visible:border-[var(--bronze)]";

function CheckEmailIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-12 w-12" aria-hidden>
      <rect x="4" y="10" width="40" height="28" rx="4" stroke="var(--emerald)" strokeWidth="2" />
      <path d="M4 12l20 15L44 12" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <motion.path
        d="M17 27l5.5 5.5L33 21"
        stroke="var(--emerald)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}

export function SignupForm() {
  const reduce = useReducedMotion();
  const honeypotId = useId();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan");
  const validInitialPlan = PLAN_OPTIONS.some((p) => p.id === initialPlan) ? initialPlan! : "pro";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [planId, setPlanId] = useState<string>(validInitialPlan);
  const [hp, setHp] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, businessName, planId, [HONEYPOT_FIELD]: hp }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setState("error");
        setMsg(json.error ?? "No pudimos crear tu cuenta.");
        return;
      }
      if (json.requiresEmailConfirmation) {
        setState("check-email");
        return;
      }
      const appUrl = process.env.NEXT_PUBLIC_AUREO_APP_URL;
      const { access_token, refresh_token } = json.session;
      window.location.href = `${appUrl}/index.html#access_token=${encodeURIComponent(
        access_token
      )}&refresh_token=${encodeURIComponent(refresh_token)}`;
    } catch {
      setState("error");
      setMsg("Revisa tu conexión e intenta de nuevo.");
    }
  }

  if (state === "check-email") {
    return (
      <motion.div
        role="status"
        className="flex flex-col items-center gap-4 py-4 text-center"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedTransition(reduce, 0, 0.45)}
      >
        <motion.div
          initial={reduce ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={
            reduce ? { duration: 0 } : { delay: 0.1, type: "spring", damping: 14, stiffness: 160 }
          }
        >
          <CheckEmailIcon />
        </motion.div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            ¡Cuenta creada!
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Te enviamos un correo de confirmación. Ábrelo y sigue el enlace —
            te llevará directo a iniciar sesión.
          </p>
        </div>
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
          Crea tu cuenta
        </h1>
        <div className="mt-2 h-0.5 w-10 rounded-full bg-[var(--bronze)]" aria-hidden />
        <p className="mt-3 text-[var(--text-secondary)]">
          14 días gratis, sin tarjeta. Empieza a controlar tu inventario hoy mismo.
        </p>
      </motion.div>
      <label htmlFor={honeypotId} className="sr-only">
        Deja este campo vacío
      </label>
      <input
        id={honeypotId}
        type="text"
        name={HONEYPOT_FIELD}
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <motion.div variants={fadeUp}>
        <Input
          type="text"
          required
          placeholder="Nombre de tu negocio"
          aria-label="Nombre de tu negocio"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className={`min-h-11 ${inputGlow}`}
        />
      </motion.div>
      <motion.div variants={fadeUp}>
        <Input
          type="email"
          required
          placeholder="Tu correo"
          aria-label="Correo electrónico"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`min-h-11 ${inputGlow}`}
        />
      </motion.div>
      <motion.div variants={fadeUp}>
        <Input
          type="password"
          required
          placeholder="Contraseña (mínimo 8 caracteres)"
          aria-label="Contraseña"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`min-h-11 ${inputGlow}`}
        />
      </motion.div>
      <motion.div variants={fadeUp} className="flex gap-2">
        {PLAN_OPTIONS.map((p) => (
          <motion.button
            key={p.id}
            type="button"
            onClick={() => setPlanId(p.id)}
            aria-pressed={planId === p.id}
            whileHover={reduce ? undefined : { scale: 1.03 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              planId === p.id
                ? "border-[var(--bronze)] bg-[var(--bronze)]/10 text-[var(--bronze)]"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
            }`}
          >
            {p.label}
          </motion.button>
        ))}
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
            {state === "loading" ? "Creando cuenta…" : "Iniciar prueba gratis"}
          </Button>
        </motion.div>
      </motion.div>
      <motion.p
        key={msg || "idle"}
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
