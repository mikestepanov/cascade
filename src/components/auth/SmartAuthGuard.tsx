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

    const publicPaths = [ROUTES.home as string, ROUTES.signin as string, ROUTES.signup as string];
    const isPublicPath = publicPaths.includes(location.pathname);
    const isOnboarding = location.pathname === ROUTES.onboarding;
    const shouldBeOnboarding = redirectPath === ROUTES.onboarding;

    // Redirect if:
    // 1. User is on a public page (home, signin, signup)
    // 2. User is on the wrong onboarding/dashboard state
    const needsRedirect = isPublicPath || isOnboarding !== shouldBeOnboarding;

    if (needsRedirect) {
      navigate({ to: redirectPath, replace: true });
    }
  }, [redirectPath, location.pathname, navigate]);

  // Determine if we should show a loading spinner while redirecting
  const publicPaths = [ROUTES.home as string, ROUTES.signin as string, ROUTES.signup as string];
  const isPublicPath = publicPaths.includes(location.pathname);
  const isOnboarding = location.pathname === ROUTES.onboarding;
  const shouldBeOnboarding = redirectPath === ROUTES.onboarding;
  const needsRedirect = redirectPath && (isPublicPath || isOnboarding !== shouldBeOnboarding);

  if (redirectPath === undefined || needsRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
