import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada · Aureo",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-6 px-5 text-center">
      <span className="font-display text-6xl font-extrabold text-[var(--primary)]">
        404
      </span>
      <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
        Esta página se perdió en la bodega.
      </h1>
      <p className="text-[var(--text-secondary)]">
        No encontramos lo que buscabas. Puede que el enlace esté roto o que la
        página se haya movido.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-lg bg-[var(--primary)] px-5 font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
        >
          Volver al inicio
        </Link>
        <Link
          href="/#contacto"
          className="inline-flex min-h-11 items-center rounded-lg border border-[var(--border-subtle)] px-5 font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--primary)]"
        >
          Contáctanos
        </Link>
      </div>
    </main>
  );
}
