import { site } from "@/content/site";

export function WhatsAppButton() {
  return (
    <a
      href={site.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--emerald)] text-white shadow-lg hover:opacity-90"
    >
      <span className="font-bold">WA</span>
    </a>
  );
}
