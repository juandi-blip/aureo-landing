"use client";
import { useId, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HONEYPOT_FIELD } from "@/lib/validation";

type FormState = "idle" | "loading" | "error" | "check-email";

const PLAN_OPTIONS: { id: "starter" | "pro" | "logistica"; label: string }[] = [
  { id: "starter", label: "Starter" },
  { id: "pro", label: "Pro" },
  { id: "logistica", label: "Logística" },
];

export function SignupForm() {
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
      <p role="status" className="text-[var(--emerald)] font-semibold">
        ¡Listo! Revisa tu correo para confirmar tu cuenta antes de entrar.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-3" noValidate>
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
      <Input
        type="text"
        required
        placeholder="Nombre de tu negocio"
        aria-label="Nombre de tu negocio"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        className="min-h-11"
      />
      <Input
        type="email"
        required
        placeholder="Tu correo"
        aria-label="Correo electrónico"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="min-h-11"
      />
      <Input
        type="password"
        required
        placeholder="Contraseña (mínimo 8 caracteres)"
        aria-label="Contraseña"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="min-h-11"
      />
      <div className="flex gap-2">
        {PLAN_OPTIONS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlanId(p.id)}
            aria-pressed={planId === p.id}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
              planId === p.id
                ? "border-[var(--bronze)] bg-[var(--bronze)]/10 text-[var(--bronze)]"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <Button type="submit" disabled={state === "loading"} aria-busy={state === "loading"} className="min-h-11">
        {state === "loading" ? "Creando cuenta…" : "Iniciar prueba gratis"}
      </Button>
      <p role="alert" aria-live="polite" className="min-h-5 text-sm text-[var(--terracotta)]">
        {state === "error" ? msg : ""}
      </p>
    </form>
  );
}
