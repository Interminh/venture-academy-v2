import { Hero } from "./(marketing)/components/Hero";
import { HowItWorks } from "./(marketing)/components/HowItWorks";
import { MissionTeam } from "./(marketing)/components/MissionTeam";
import { CtaSection } from "./(marketing)/components/CtaSection";
import { SiteHeader } from "./(marketing)/components/SiteHeader";
import { SiteFooter } from "./(marketing)/components/SiteFooter";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <MissionTeam />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
