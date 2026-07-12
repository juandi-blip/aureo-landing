"use client";
import { useEffect, useId, useState } from "react";
import { track } from "@vercel/analytics";
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
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");
  const [emailState, setEmailState] = useState<EmailState>("idle");
  const [msg, setMsg] = useState("");
  const [token, setToken] = useState("");
  const [shareCode, setShareCode] = useState("");
  const [step, setStepState] = useState<WaitlistStep>("email");
  const [refCode] = useState(() => {
    if (typeof window === "undefined") return "";
    const ref = new URLSearchParams(window.location.search).get("ref");
    return ref ? ref.trim().slice(0, 40) : "";
  });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(token))
      .then((buf) => {
        if (cancelled) return;
        const hex = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        // Prefijo "r-" garantiza que este codigo nunca coincide con un id
        // real de Supabase (formato UUID), asi que aunque se comparta
        // publicamente nunca sirve para autorizar el PATCH del perfil.
        setShareCode(`r-${hex.slice(0, 24)}`);
      })
      .catch(() => setShareCode(""));
    return () => {
      cancelled = true;
    };
  }, [token]);

  function setStep(next: WaitlistStep) {
    setStepState(next);
    onStepChange?.(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setEmailState("error");
      setMsg("Debes aceptar la Política de Privacidad para continuar.");
      return;
    }
    setEmailState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          origen: refCode ? `${origen}:ref:${refCode}` : origen,
          [HONEYPOT_FIELD]: hp,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        // Evento de conversión: el alta a la waitlist es la métrica principal.
        track("waitlist_signup", { origen: refCode ? `${origen}:ref` : origen });
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
    const shareLink =
      typeof window !== "undefined" && shareCode
        ? `${window.location.origin}${window.location.pathname}?ref=${shareCode}`
        : "";
    return (
      <div className="flex flex-col gap-2">
        <p role="status" className="text-[var(--emerald)] font-semibold">
          ¡Gracias! Te avisaremos apenas lancemos.
        </p>
        {shareLink && (
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
            <input
              readOnly
              aria-label="Tu link de invitación"
              value={shareLink}
              onFocus={(e) => e.currentTarget.select()}
              className="min-h-9 flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 text-sm text-[var(--text-primary)]"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(shareLink).catch(() => {});
              }}
              className="min-h-9 rounded-lg border border-[var(--bronze)] px-3 text-sm font-semibold text-[var(--bronze)]"
            >
              Copiar link
            </button>
          </div>
        )}
      </div>
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
          className="flex-1 min-h-11 bg-[var(--bg-base)] text-[var(--text-primary)] border-[var(--border-subtle)]"
        />
        <Button type="submit" disabled={emailState === "loading"} aria-busy={emailState === "loading"} className="min-h-11">
          {emailState === "loading" ? "Enviando…" : "Unirme"}
        </Button>
      </div>
      <label className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--bronze)]"
          aria-label="Acepto la Política de Privacidad"
        />
        <span>
          Acepto la{" "}
          <a
            href="/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[var(--primary)]"
          >
            Política de Privacidad
          </a>{" "}
          y el tratamiento de mis datos para recibir información sobre Aureo.
        </span>
      </label>
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
      // Response deliberately not inspected to keep genuine server errors indistinguishable from anti-IDOR silent no-ops.
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
          className="min-h-11 bg-[var(--bg-base)] text-[var(--text-primary)] border-[var(--border-subtle)]"
        />
        <select
          aria-label="Tipo de negocio"
          value={negocio}
          onChange={(e) => setNegocio(e.target.value)}
          className="h-11 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 text-base text-[var(--text-primary)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
            className="min-h-11 bg-[var(--bg-base)] text-[var(--text-primary)] border-[var(--border-subtle)]"
          />
        )}
        <Input
          type="text"
          placeholder="Tu ciudad (opcional)"
          aria-label="Ciudad"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          className="min-h-11 bg-[var(--bg-base)] text-[var(--text-primary)] border-[var(--border-subtle)]"
        />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading} aria-busy={loading} className="min-h-11">
            {loading ? "Guardando…" : "Completar perfil"}
          </Button>
          <button
            type="button"
            onClick={onDone}
            disabled={loading}
            className="text-sm text-[var(--bronze)] underline underline-offset-2 disabled:opacity-50"
          >
            Ahora no
          </button>
        </div>
      </form>
    </div>
  );
}
