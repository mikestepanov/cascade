import { createFileRoute } from "@tanstack/react-router";
import {
  CircuitFlowLines,
  FeaturesSection,
  Footer,
  HeroSection,
  NavHeader,
  WhyChooseSection,
} from "@/components/landing";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-ui-bg-hero text-white overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-[120px] bg-brand-500 opacity-10" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 rounded-full blur-[120px] bg-status-info-text opacity-10" />
        <div className="absolute bottom-20 left-1/3 w-64 h-64 rounded-full blur-[120px] bg-status-success-text opacity-10" />
      </div>

      {/* Circuit Flow Lines - spans full page */}
      <CircuitFlowLines />

      {/* Content */}
      <div className="relative z-10">
        <NavHeader />
        <HeroSection />
        <FeaturesSection />
        <WhyChooseSection />
        <Footer />
      </div>
    </div>
  );
}
