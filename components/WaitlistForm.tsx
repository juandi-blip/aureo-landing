"use client";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HONEYPOT_FIELD } from "@/lib/validation";

type EmailState = "idle" | "loading" | "success" | "error";
export type WaitlistStep = "email" | "detalle" | "done";

const NEGOCIO_OPCIONES = [
  "Ferretería",
  "Distribuidora",
  "Depósito de construcción",
  "Repuestos",
  "Otro",
];

export function WaitlistForm({
  origen,
  onStepChange,
}: {
  origen: string;
  onStepChange?: (step: WaitlistStep) => void;
}) {
  const honeypotId = useId();
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [emailState, setEmailState] = useState<EmailState>("idle");
  const [msg, setMsg] = useState("");
  const [token, setToken] = useState("");
  const [step, setStepState] = useState<WaitlistStep>("email");

  function setStep(next: WaitlistStep) {
    setStepState(next);
    onStepChange?.(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, origen, [HONEYPOT_FIELD]: hp }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setEmailState("success");
        setMsg("¡Listo! Cuéntanos un poco más para priorizar tu acceso.");
        setToken(typeof json.token === "string" ? json.token : "");
        setStep("detalle");
      } else {
        setEmailState("error");
        setMsg(json.error ?? "No pudimos registrarte. Intenta de nuevo.");
      }
    } catch {
      setEmailState("error");
      setMsg("Revisa tu conexión e intenta de nuevo.");
    }
  }

  if (step === "done") {
    return (
      <p role="status" className="text-[var(--emerald)] font-semibold">
        ¡Gracias! Te avisaremos apenas lancemos.
      </p>
    );
  }

  if (step === "detalle") {
    return <DetalleForm email={email} token={token} successMessage={msg} onDone={() => setStep("done")} />;
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-2" noValidate>
      {/* Honeypot: visually hidden (not aria-hidden) so it stays out of view for real users
          but remains a labeled, accessible field rather than a focusable element trapped
          inside aria-hidden — bots fill it by name, screen reader users are told to skip it. */}
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          required
          placeholder="Tu correo"
          aria-label="Correo electrónico"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 min-h-11"
        />
        <Button type="submit" disabled={emailState === "loading"} aria-busy={emailState === "loading"} className="min-h-11">
          {emailState === "loading" ? "Enviando…" : "Unirme"}
        </Button>
      </div>
      <p
        role="alert"
        aria-live="polite"
        className="min-h-5 text-sm text-[var(--terracotta)]"
      >
        {emailState === "error" ? msg : ""}
      </p>
    </form>
  );
}

function DetalleForm({
  email,
  token,
  successMessage,
  onDone,
}: {
  email: string;
  token: string;
  successMessage: string;
  onDone: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [negocio, setNegocio] = useState("");
  const [negocioOtro, setNegocioOtro] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const negocioFinal = negocio === "Otro" ? negocioOtro : negocio;
    try {
      await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, token, nombre, negocio: negocioFinal, ciudad }),
      });
    } catch {
      // Enriquecimiento opcional: un fallo de red no debe bloquear al usuario.
    } finally {
      setLoading(false);
      onDone();
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <p role="status" className="text-[var(--emerald)] font-semibold">
        {successMessage}
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <Input
          type="text"
          placeholder="Tu nombre (opcional)"
          aria-label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="min-h-11"
        />
        <select
          aria-label="Tipo de negocio"
          value={negocio}
          onChange={(e) => setNegocio(e.target.value)}
          className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Tipo de negocio (opcional)</option>
          {NEGOCIO_OPCIONES.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
        {negocio === "Otro" && (
          <Input
            type="text"
            placeholder="¿Cuál?"
            aria-label="Especifica tu tipo de negocio"
            value={negocioOtro}
            onChange={(e) => setNegocioOtro(e.target.value)}
            className="min-h-11"
          />
        )}
        <Input
          type="text"
          placeholder="Tu ciudad (opcional)"
          aria-label="Ciudad"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          className="min-h-11"
        />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading} aria-busy={loading} className="min-h-11">
            {loading ? "Guardando…" : "Completar perfil"}
          </Button>
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-[var(--text-secondary)] underline underline-offset-2"
          >
            Ahora no
          </button>
        </div>
      </form>
    </div>
  );
}
