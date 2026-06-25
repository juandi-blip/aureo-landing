import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-base)] py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 text-center">
        <span className="font-display text-xl font-extrabold text-[var(--primary)]">{site.marca}</span>
        <p className="text-sm text-[var(--text-secondary)]">{site.footer.tagline}</p>
        <p className="text-xs text-[var(--text-muted)]">{site.footer.derechos}</p>
      </div>
    </footer>
  );
}
