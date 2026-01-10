import { api } from "@convex/_generated/api";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { ROUTES } from "@/config/routes";
import { LoadingSpinner } from "../ui/LoadingSpinner";

/**
 * SmartAuthGuard - Centralized "bouncer" for authenticated routes.
 * It ensures the user is on the correct page based on their onboarding and company status.
 */
export function SmartAuthGuard({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = useQuery(api.auth.getRedirectDestination);

  useEffect(() => {
    if (redirectPath === undefined || !redirectPath) return;

    const isOnboarding = location.pathname === ROUTES.onboarding;
    const shouldBeOnboarding = redirectPath === ROUTES.onboarding;

    if (isOnboarding !== shouldBeOnboarding) {
      navigate({ to: redirectPath, replace: true });
    }
  }, [redirectPath, location.pathname, navigate]);

  // Show loading while we determine the destination or if we are in the middle of a redirect
  const isOnboarding = location.pathname === ROUTES.onboarding;
  const shouldBeOnboarding = redirectPath === ROUTES.onboarding;
  const needsRedirect = redirectPath && isOnboarding !== shouldBeOnboarding;

  if (redirectPath === undefined || needsRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
