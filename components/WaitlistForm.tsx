"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type State = "idle" | "loading" | "success" | "error";

export function WaitlistForm({ origen }: { origen: string }) {
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ email, origen }),
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
    <form onSubmit={onSubmit} className="relative flex w-full max-w-md flex-col gap-3 sm:flex-row" noValidate>
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
      {state === "error" && (
        <p role="alert" className="text-[var(--terracotta)] text-sm sm:absolute sm:top-full sm:mt-1">{msg}</p>
      )}
    </form>
  );
}
