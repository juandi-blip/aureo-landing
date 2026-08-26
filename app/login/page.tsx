import { LoginForm } from "@/components/LoginForm";

export const metadata = {
  title: "Inicia sesión · Aureo",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5 py-16">
      <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
        Inicia sesión
      </h1>
      <LoginForm />
    </main>
  );
}
