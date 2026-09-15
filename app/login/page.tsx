import { LoginForm } from "@/components/LoginForm";
import { AuthCard } from "@/components/ui/AuthCard";
import { AuthSplitPanel } from "@/components/ui/AuthSplitPanel";

export const metadata = {
  title: "Inicia sesión · Aureo",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <AuthSplitPanel />
      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-md">
          <AuthCard>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              Inicia sesión
            </h1>
            <div className="mt-2 h-0.5 w-10 rounded-full bg-[var(--bronze)]" aria-hidden />
            <div className="mt-6">
              <LoginForm />
            </div>
          </AuthCard>
        </div>
      </div>
    </div>
  );
}
