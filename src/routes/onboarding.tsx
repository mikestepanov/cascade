import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
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
        <Navigate to="/" />
      </Unauthenticated>
    </>
  );
}
