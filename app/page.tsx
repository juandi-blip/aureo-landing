import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { ProblemSection } from "@/components/ProblemSection";
import { HowItWorks } from "@/components/HowItWorks";
import { ModulesGrid } from "@/components/ModulesGrid";
import { DemoSection } from "@/components/DemoSection";
import { FoundersStory } from "@/components/FoundersStory";
import { PricingTable } from "@/components/PricingTable";
// SecuritySection (métodos de pago + garantías de seguridad de pago) está
// deshabilitada mientras estemos en fase lista de espera: aún no existe
// pasarela de pago ni facturación DIAN integrada, así que hablar de "cómo
// protegemos tu pago" es prematuro. El componente y su contenido
// (site.seguridad) se conservan intactos para reactivarla apenas se
// integre una pasarela real — solo hay que reimportar y volver a renderizar.
// import { SecuritySection } from "@/components/SecuritySection";
import { FAQ } from "@/components/FAQ";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <ModulesGrid />
        <DemoSection />
        <FoundersStory />
        <PricingTable />
        {/* <SecuritySection /> — ver nota de import más arriba */}
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
