import { Suspense } from "react";
import { SignupForm } from "@/components/SignupForm";
import { AuthCard } from "@/components/ui/AuthCard";
import { AuthAmbient } from "@/components/ui/AuthAmbient";

export const metadata = {
  title: "Crea tu cuenta · Aureo",
  description: "Inicia tu prueba gratuita de 14 días en Aureo.",
};

export default function RegistroPage() {
  return (
    <AuthAmbient>
      <AuthCard>
        <Suspense fallback={null}>
          <SignupForm />
        </Suspense>
      </AuthCard>
    </AuthAmbient>
  );
}
