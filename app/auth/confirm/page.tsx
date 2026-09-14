import { Suspense } from "react";
import { ConfirmAccount } from "@/components/ConfirmAccount";
import { AuthCard } from "@/components/ui/AuthCard";
import { AuthAmbient } from "@/components/ui/AuthAmbient";

export const metadata = {
  title: "Confirma tu cuenta · Aureo",
};

export default function ConfirmPage() {
  return (
    <AuthAmbient>
      <AuthCard>
        <Suspense fallback={null}>
          <ConfirmAccount />
        </Suspense>
      </AuthCard>
    </AuthAmbient>
  );
}
