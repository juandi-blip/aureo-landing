"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeUp, staggerContainer, reducedTransition } from "@/lib/motion";

type FormState = "idle" | "loading" | "error";

const inputGlow =
  "focus-visible:shadow-[0_0_0_4px_var(--bronze-glow)] focus-visible:border-[var(--bronze)]";

export function LoginForm() {
  const reduce = useReducedMotion();
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
    <motion.form
      onSubmit={onSubmit}
      className="flex w-full max-w-md flex-col gap-3"
      noValidate
      variants={staggerContainer}
      initial={reduce ? false : "hidden"}
      animate="visible"
    >
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
          placeholder="Contraseña"
          aria-label="Contraseña"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`min-h-11 ${inputGlow}`}
        />
      </motion.div>
      <motion.div variants={fadeUp} className="w-full">
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
            {state === "loading" ? "Entrando…" : "Iniciar sesión"}
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
