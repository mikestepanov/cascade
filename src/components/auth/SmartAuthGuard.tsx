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
export function SmartAuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = useQuery(api.auth.getRedirectDestination);

  useEffect(() => {
    if (redirectPath === undefined) return;

    // Follow the backend's recommendation if it doesn't match current location
    const currentPath = location.pathname;

    if (redirectPath) {
      // Check if the current path matches the intended state
      // 1. If we should be on onboarding, we must be exactly on /onboarding
      // 2. If we should be on a dashboard, the path must be a dashboard path (not /onboarding)
      const isCorrectPath =
        (redirectPath === ROUTES.onboarding && currentPath === ROUTES.onboarding) ||
        (redirectPath !== ROUTES.onboarding && currentPath !== ROUTES.onboarding);

      if (!isCorrectPath) {
        navigate({ to: redirectPath, replace: true });
      }
    }
  }, [redirectPath, location.pathname, navigate]);

  if (redirectPath === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
