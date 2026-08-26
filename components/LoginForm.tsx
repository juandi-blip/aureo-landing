"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormState = "idle" | "loading" | "error";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setState("error");
        setMsg(json.error ?? "Correo o contraseña incorrectos.");
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

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-3" noValidate>
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
        placeholder="Contraseña"
        aria-label="Contraseña"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="min-h-11"
      />
      <Button type="submit" disabled={state === "loading"} aria-busy={state === "loading"} className="min-h-11">
        {state === "loading" ? "Entrando…" : "Iniciar sesión"}
      </Button>
      <p role="alert" aria-live="polite" className="min-h-5 text-sm text-[var(--terracotta)]">
        {state === "error" ? msg : ""}
      </p>
    </form>
  );
}
