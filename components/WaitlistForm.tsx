"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HONEYPOT_FIELD } from "@/lib/validation";

type State = "idle" | "loading" | "success" | "error";

export function WaitlistForm({ origen }: { origen: string }) {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, origen, [HONEYPOT_FIELD]: hp }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setState("success");
        setMsg(json.duplicate ? "¡Ya estás en la lista! Te avisaremos." : "¡Listo! Te avisaremos del lanzamiento.");
      } else {
        setState("error");
        setMsg(json.error ?? "No pudimos registrarte. Intenta de nuevo.");
      }
    } catch {
      setState("error");
      setMsg("Revisa tu conexión e intenta de nuevo.");
    }
  }

  if (state === "success") {
    return <p role="status" className="text-[var(--emerald)] font-semibold">{msg}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-2" noValidate>
      {/* Honeypot: hidden from real users, attractive to bots. */}
      <input
        type="text"
        name={HONEYPOT_FIELD}
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
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
        <Button type="submit" disabled={state === "loading"} aria-busy={state === "loading"} className="min-h-11">
          {state === "loading" ? "Enviando…" : "Unirme"}
        </Button>
      </div>
      <p
        role="alert"
        aria-live="polite"
        className="min-h-5 text-sm text-[var(--terracotta)]"
      >
        {state === "error" ? msg : ""}
      </p>
    </form>
  );
}
