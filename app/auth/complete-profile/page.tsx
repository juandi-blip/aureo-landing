import { CompleteProfileForm } from "@/components/CompleteProfileForm";
import { AuthCard } from "@/components/ui/AuthCard";
import { AuthAmbient } from "@/components/ui/AuthAmbient";

export const metadata = {
  title: "Completa tu perfil · Aureo",
  robots: { index: false },
};

export default function CompleteProfilePage() {
  return (
    <AuthAmbient>
      <AuthCard>
        <CompleteProfileForm />
      </AuthCard>
    </AuthAmbient>
  );
}
