import { LoginForm } from "@/components/LoginForm";
import { AuthCard } from "@/components/ui/AuthCard";
import { AuthAmbient } from "@/components/ui/AuthAmbient";

export const metadata = {
  title: "Inicia sesión · Aureo",
};

export default function LoginPage() {
  return (
    <AuthAmbient>
      <AuthCard>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Inicia sesión
        </h1>
        <div className="mt-2 h-0.5 w-10 rounded-full bg-[var(--bronze)]" aria-hidden />
        <div className="mt-6">
          <LoginForm />
        </div>
      </AuthCard>
    </AuthAmbient>
  );
}
