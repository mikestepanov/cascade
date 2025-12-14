import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/landing";
import { CircuitFlowLines, FeaturesSection, HeroSection, NavHeader } from "@/components/landing/v2";

export const Route = createFileRoute("/v2")({
  component: LandingPageV2,
});

function LandingPageV2() {
  return (
    <div className="min-h-screen w-full bg-[#0a0e17] text-white overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Circuit Flow Lines - spans full page */}
      <CircuitFlowLines />

      {/* Content */}
      <div className="relative z-10">
        <NavHeader />
        <HeroSection />
        <FeaturesSection />
        <Footer />
      </div>
    </div>
  );
}
