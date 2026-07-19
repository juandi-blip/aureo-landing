"use client";
import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, VIEWPORT } from "@/lib/motion";
import { GrainOverlay } from "@/components/ui/GrainOverlay";
import { SpotlightGlow, useSpotlight } from "@/components/ui/Spotlight";
import { DemoGateModal, type GateReason } from "@/components/DemoGateModal";

const VIDEO_SRC =
  process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || "/aureo-video.mp4";

const DEMO_URL = process.env.NEXT_PUBLIC_DEMO_URL || "";

// Reads the `?demo=` param (set when aureo-demo redirects back after a
// missing/expired gate session) once, on initial mount.
function readInitialGateReason(): GateReason {
  if (typeof window === "undefined") return null;
  const demoParam = new URLSearchParams(window.location.search).get("demo");
  return demoParam === "required" || demoParam === "expired" ? demoParam : null;
}

export function DemoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const spotlight = useSpotlight();
  const [gateReason, setGateReason] = useState<GateReason>(readInitialGateReason);
  const [gateOpen, setGateOpen] = useState(() => readInitialGateReason() !== null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  function handleUnmute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setMuted(false);
    if (video.paused) video.play().catch(() => {});
  }

  function handleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    setMuted(true);
  }

  return (
    <section
      className="relative overflow-hidden bg-[var(--bg-navy)] py-24"
      onMouseMove={spotlight.onMouseMove}
      onMouseLeave={spotlight.onMouseLeave}
    >
      <GrainOverlay />
      <SpotlightGlow mouseX={spotlight.mouseX} mouseY={spotlight.mouseY} />
      <div className="relative z-10 mx-auto max-w-6xl px-5 text-center">
        <motion.span
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--bronze)]/40 bg-[var(--bronze)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--bronze)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--emerald)]" aria-hidden />
          {site.demo.eyebrow}
        </motion.span>

        <div className="mt-4">
          <SectionHeading light>{site.demo.titulo}</SectionHeading>
        </div>

        <motion.p
          className="mx-auto mt-4 max-w-2xl text-[var(--text-cream)]/70"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.demo.texto}
        </motion.p>

        <motion.div
          className="relative mx-auto mt-12 max-w-5xl"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {/* Breathing glow bloom behind the frame */}
          <div className="pointer-events-none absolute -inset-10 -z-10" aria-hidden>
            <div
              className="h-full w-full animate-breathe"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(168,116,43,0.16) 0%, transparent 65%)",
              }}
            />
          </div>

          {/* Floating feature badges — hidden on small screens to avoid overlap */}
          <div className="pointer-events-none absolute -top-5 left-6 z-20 hidden gap-2 sm:flex sm:flex-wrap sm:max-w-[70%]">
            {site.demo.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-[var(--bronze)]/50 bg-[var(--bg-navy)]/90 px-3 py-1 text-xs font-semibold text-[var(--text-cream)] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4)] backdrop-blur-sm"
              >
                {badge}
              </span>
            ))}
          </div>

          <div className="shimmer-border relative overflow-hidden rounded-[var(--radius-lg)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)]">
            {/* Browser-chrome header bar — signals a real running product */}
            <div className="flex items-center gap-2 border-b border-white/10 bg-[var(--bg-navy)] px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" aria-hidden />
              <span className="ml-3 truncate rounded-md bg-white/10 px-3 py-1 text-xs text-[var(--text-cream)]/70">
                app.aureo.com
              </span>
            </div>

            <video
              ref={videoRef}
              className="w-full"
              src={VIDEO_SRC}
              poster="/aureo-video-poster.jpg"
              muted
              playsInline
              loop
              preload="metadata"
            />

            <motion.button
              className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              onClick={muted ? handleUnmute : handleMute}
              aria-label={muted ? "Activar sonido" : "Silenciar"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {muted ? (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0017.73 18l2 2L21 18.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                  Activar sonido
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                  Silenciar
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {DEMO_URL && (
          <motion.div
            className="mt-9 flex flex-col items-center gap-3.5"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            <button
              type="button"
              onClick={() => {
                setGateReason(null);
                setGateOpen(true);
              }}
              className="group inline-flex items-center gap-2.5 rounded-full border border-[var(--bronze)]/50 bg-gradient-to-r from-[var(--bronze)]/15 via-[var(--bronze)]/10 to-[var(--bronze)]/15 px-7 py-3 text-sm font-semibold text-[var(--text-cream)] shadow-[0_0_26px_-10px_var(--bronze-glow)] transition-all hover:border-[var(--bronze)]/80 hover:shadow-[0_0_34px_-8px_var(--bronze-glow)]"
            >
              {site.demo.ctaExplorar}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-[var(--bronze)] transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
            <p className="max-w-sm text-sm leading-relaxed text-[var(--text-cream)]/60">
              {site.demo.ctaExplorarNota}
            </p>
          </motion.div>
        )}
        <DemoGateModal
          open={gateOpen}
          onOpenChange={setGateOpen}
          demoUrl={DEMO_URL}
          reason={gateReason}
        />
      </div>
    </section>
  );
}
