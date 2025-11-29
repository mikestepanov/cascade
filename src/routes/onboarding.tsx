import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { NixeloLanding } from "@/components/NixeloLanding";
import { OnboardingPage } from "@/pages/OnboardingPage";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingRoute,
  ssr: false, // No SSR needed for onboarding
});

function OnboardingRoute() {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate({ to: "/dashboard" });
  };

  return (
    <>
      <Authenticated>
        <OnboardingPage onComplete={handleComplete} />
      </Authenticated>
      <Unauthenticated>
        <NixeloLanding />
      </Unauthenticated>
    </>
  );
}
