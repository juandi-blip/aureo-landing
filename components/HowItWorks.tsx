import { site } from "@/content/site";

export function HowItWorks() {
  return (
    <section id="como" className="py-20">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">{site.comoFunciona.titulo}</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {site.comoFunciona.pasos.map((p, i) => (
            <div key={p.titulo}>
              <span className="font-display text-4xl font-extrabold text-[var(--primary-soft)]">{i + 1}</span>
              <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{p.titulo}</h3>
              <p className="mt-2 text-[var(--text-secondary)]">{p.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
