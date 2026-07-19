"use client";
import { useId, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { track } from "@vercel/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HONEYPOT_FIELD } from "@/lib/validation";
import { site } from "@/content/site";

type GateState = "idle" | "loading" | "error";
export type GateReason = "required" | "expired" | null;

export function DemoGateModal({
  open,
  onOpenChange,
  demoUrl,
  reason,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demoUrl: string;
  reason: GateReason;
}) {
  const honeypotId = useId();
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<GateState>("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setMsg("");
    try {
      const waitlistRes = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, nombre, origen: "demo", [HONEYPOT_FIELD]: hp }),
      });
      const waitlistJson = await waitlistRes.json();
      if (!waitlistRes.ok || !waitlistJson.ok) {
        setState("error");
        setMsg(waitlistJson.error ?? "No pudimos registrarte. Intenta de nuevo.");
        return;
      }

      const tokenRes = await fetch("/api/demo-token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const tokenJson = await tokenRes.json();
      if (!tokenRes.ok || !tokenJson.ok || typeof tokenJson.token !== "string") {
        setState("error");
        setMsg("No pudimos generar tu acceso a la demo. Intenta de nuevo.");
        return;
      }

      track("demo_gate_unlocked");
      window.location.href = `${demoUrl}/login.html?token=${encodeURIComponent(tokenJson.token)}`;
    } catch {
      setState("error");
      setMsg("Revisa tu conexión e intenta de nuevo.");
    }
  }

  const heading = reason === "expired" ? site.demo.gateExpiradoTitulo : site.demo.gateTitulo;
  const texto = reason === "expired" ? site.demo.gateExpiradoTexto : site.demo.gateTexto;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-navy)] p-6 text-[var(--text-cream)] shadow-2xl">
          <Dialog.Title className="text-lg font-semibold">{heading}</Dialog.Title>
          <p className="mt-1.5 text-sm text-[var(--text-cream)]/70">{texto}</p>
          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3" noValidate>
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
              type="email"
              required
              placeholder="Tu correo"
              aria-label="Correo electrónico"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-11 bg-[var(--bg-base)] text-[var(--text-primary)] border-[var(--border-subtle)]"
            />
            <Input
              type="text"
              placeholder="Tu nombre (opcional)"
              aria-label="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="min-h-11 bg-[var(--bg-base)] text-[var(--text-primary)] border-[var(--border-subtle)]"
            />
            <Button
              type="submit"
              disabled={state === "loading"}
              aria-busy={state === "loading"}
              className="min-h-11"
            >
              {state === "loading" ? "Entrando…" : site.demo.gateBoton}
            </Button>
            <p role="alert" aria-live="polite" className="min-h-5 text-sm text-[var(--terracotta)]">
              {state === "error" ? msg : ""}
            </p>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
