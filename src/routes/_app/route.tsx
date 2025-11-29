import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { NixeloLanding } from "@/components/NixeloLanding";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
  ssr: false, // Disable SSR for entire app section
});

function AppLayout() {
  return (
    <>
      <Authenticated>
        <AuthenticatedApp />
      </Authenticated>
      <Unauthenticated>
        <NixeloLanding />
      </Unauthenticated>
    </>
  );
}

function AuthenticatedApp() {
  const navigate = useNavigate();
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);

  // Loading state while checking onboarding
  if (onboardingStatus === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to onboarding if not completed
  if (onboardingStatus === null || !onboardingStatus.onboardingCompleted) {
    // Use effect to navigate to avoid render-time navigation
    navigate({ to: "/onboarding" });
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <Outlet />;
}
