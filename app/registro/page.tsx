import { Suspense } from "react";
import { SignupForm } from "@/components/SignupForm";
import { AuthCard } from "@/components/ui/AuthCard";

export const metadata = {
  title: "Crea tu cuenta · Aureo",
  description: "Inicia tu prueba gratuita de 14 días en Aureo.",
};

export default function RegistroPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5 py-16">
      <AuthCard>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Crea tu cuenta
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          14 días gratis, sin tarjeta. Empieza a controlar tu inventario hoy mismo.
        </p>
        <div className="mt-6">
          <Suspense fallback={null}>
            <SignupForm />
          </Suspense>
        </div>
      </AuthCard>
    </main>
  );
}
