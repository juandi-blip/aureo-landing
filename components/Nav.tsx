import { site } from "@/content/site";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <span className="font-display text-2xl font-extrabold text-[var(--primary)]">{site.marca}</span>
        <div className="hidden gap-7 text-sm font-semibold text-[var(--text-secondary)] md:flex">
          <a href="#producto" className="rounded hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">Producto</a>
          <a href="#como" className="rounded hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">Cómo funciona</a>
          <a href="#precios" className="rounded hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">Precios</a>
          <a href="#faq" className="rounded hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">Preguntas</a>
        </div>
        <a href="#waitlist" className="rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2">
          Unirme
        </a>
      </nav>
    </header>
  );
}
