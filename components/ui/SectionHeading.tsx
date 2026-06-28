// components/ui/SectionHeading.tsx
"use client";
import { motion } from "motion/react";
import { clipReveal } from "@/lib/motion";

export function SectionHeading({
  children,
  light = false,
  className = "",
}: {
  children: React.ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <motion.h2
      className={`font-display text-4xl font-extrabold leading-tight md:text-5xl ${
        light ? "text-[var(--text-cream)]" : "text-[var(--text-primary)]"
      } ${className}`}
      variants={clipReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "120px" }}
    >
      {children}
    </motion.h2>
  );
}
