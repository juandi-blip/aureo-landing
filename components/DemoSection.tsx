"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, VIEWPORT } from "@/lib/motion";

// Served from Vercel Blob in production (set the env var); falls back to the
// local file in dev. Inlined at build time since it's NEXT_PUBLIC_*.
const VIDEO_SRC =
  process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || "/aureo-video.mp4";

export function DemoSection() {
  return (
    <section className="bg-[var(--bg-navy)] py-24">
      <div className="mx-auto max-w-6xl px-5 text-center">
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
          className="shimmer-border mx-auto mt-10 max-w-4xl overflow-hidden rounded-[var(--radius-lg)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <video
            className="w-full"
            src={VIDEO_SRC}
            poster="/aureo-video-poster.jpg"
            controls
            playsInline
            preload="none"
          />
        </motion.div>
      </div>
    </section>
  );
}
