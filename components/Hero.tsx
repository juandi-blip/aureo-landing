import { site } from "@/content/site";
import { WaitlistForm } from "@/components/WaitlistForm";

export function Hero() {
  return (
    <section id="waitlist" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-[var(--text-primary)] md:text-5xl">
            {site.hero.titulo}
          </h1>
          <p className="mt-6 text-lg text-[var(--text-secondary)]">{site.hero.subtitulo}</p>
          <div className="mt-8">
            <WaitlistForm origen="hero" />
            <p className="mt-3 text-sm text-[var(--text-muted)]">{site.hero.nota}</p>
          </div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-sm">
          {/* Captura real del dashboard de Aureo — reemplazar src en Task 17 */}
          <div className="flex aspect-[4/3] items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
            Captura del producto
          </div>
        </div>
      </div>
    </section>
  );
}
