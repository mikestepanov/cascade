import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CircuitFlowLines,
  FeaturesSection,
  Footer,
  HeroSection,
  NavHeader,
  NixeloLogo,
  WhyChooseSection,
} from "@/components/landing";
import { SignInForm } from "@/SignInForm";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin) {
    return <LoginSection onBack={() => setShowLogin(false)} />;
  }

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
        <NavHeader onGetStarted={() => setShowLogin(true)} />
        <HeroSection onGetStarted={() => setShowLogin(true)} />
        <FeaturesSection />
        <WhyChooseSection />
        <Footer />
      </div>
    </div>
  );
}

function LoginSection({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen w-full bg-[#0a0e17] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            role="img"
            aria-label="Back"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to home
        </button>
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
          <div className="text-center mb-6">
            <NixeloLogo size={48} />
            <h1 className="text-2xl font-bold mt-4 mb-2">Welcome back</h1>
            <p className="text-gray-400 text-sm">Sign in to your account to continue</p>
          </div>
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
