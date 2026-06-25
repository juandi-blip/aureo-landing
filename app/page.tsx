import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { ProblemSection } from "@/components/ProblemSection";
import { HowItWorks } from "@/components/HowItWorks";
import { ModulesGrid } from "@/components/ModulesGrid";
import { DemoSection } from "@/components/DemoSection";
import { FoundersStory } from "@/components/FoundersStory";
import { PricingTable } from "@/components/PricingTable";
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
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
