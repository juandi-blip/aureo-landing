import { Suspense } from "react";
import { SignupForm } from "@/components/SignupForm";

export const metadata = {
  title: "Crea tu cuenta · Aureo",
  description: "Inicia tu prueba gratuita de 14 días en Aureo.",
};

export default function RegistroPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5 py-16">
      <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
        Crea tu cuenta
      </h1>
      <p className="text-[var(--text-secondary)]">
        14 días gratis, sin tarjeta. Empieza a controlar tu inventario hoy mismo.
      </p>
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </main>
  );
}
