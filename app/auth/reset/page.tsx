import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { AuthCard } from "@/components/ui/AuthCard";
import { AuthAmbient } from "@/components/ui/AuthAmbient";

export const metadata = {
  title: "Restablecer contraseña · Aureo",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthAmbient>
      <AuthCard>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </AuthCard>
    </AuthAmbient>
  );
}
