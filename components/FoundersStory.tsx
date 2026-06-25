import { site } from "@/content/site";

export function FoundersStory() {
  return (
    <section className="bg-[var(--primary)] py-20 text-white">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <h2 className="font-display text-3xl font-bold">{site.fundadores.titulo}</h2>
        <p className="mt-5 text-lg leading-relaxed text-white/85">{site.fundadores.texto}</p>
        <p className="mt-8 text-sm uppercase tracking-wide text-white/60">{site.fundadores.socialProofPlaceholder}</p>
      </div>
    </section>
  );
}
