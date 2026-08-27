"use client";
import { FloatingParticles } from "@/components/ui/FloatingParticles";
import { SpotlightGlow, useSpotlight } from "@/components/ui/Spotlight";

// Shared ambient background for the login/registro pages: a few slow bronze
// particles plus a spotlight that follows the cursor, both low-opacity so
// the form stays the focal point. Same primitives as the Hero, toned down.
export function AuthAmbient({ children }: { children: React.ReactNode }) {
  const { mouseX, mouseY, onMouseMove, onMouseLeave } = useSpotlight();

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <SpotlightGlow mouseX={mouseX} mouseY={mouseY} size={520} />
      <FloatingParticles count={8} className="z-0" />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
