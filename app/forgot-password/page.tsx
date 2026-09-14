import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { AuthCard } from "@/components/ui/AuthCard";
import { AuthAmbient } from "@/components/ui/AuthAmbient";

export const metadata = {
  title: "Recuperar contraseña · Aureo",
};

export default function ForgotPasswordPage() {
  return (
    <AuthAmbient>
      <AuthCard>
        <ForgotPasswordForm />
      </AuthCard>
    </AuthAmbient>
  );
}
