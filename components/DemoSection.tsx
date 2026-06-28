"use client";
import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, VIEWPORT } from "@/lib/motion";
import { GrainOverlay } from "@/components/ui/GrainOverlay";
import { SpotlightGlow, useSpotlight } from "@/components/ui/Spotlight";

const VIDEO_SRC =
  process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || "/aureo-video.mp4";

export function DemoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const spotlight = useSpotlight();

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
        <SectionHeading light>{site.demo.titulo}</SectionHeading>

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
          className="shimmer-border relative mx-auto mt-10 max-w-4xl overflow-hidden rounded-[var(--radius-lg)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
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

          {/* Pastilla sonido — esquina inferior izquierda */}
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
        </motion.div>
      </div>
    </section>
  );
}
