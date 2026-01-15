import { api } from "@convex/_generated/api";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { ROUTE_PATTERNS } from "@/config/routes";
import { AppSplashScreen } from "./AppSplashScreen";

/**
 * SmartAuthGuard - Centralized "bouncer" for authenticated routes.
 * It ensures the user is on the correct page based on their onboarding and company status.
 */
export function SmartAuthGuard({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = useQuery(api.auth.getRedirectDestination);

  const publicPaths = [
    ROUTE_PATTERNS.home as string,
    ROUTE_PATTERNS.signin as string,
    ROUTE_PATTERNS.signup as string,
  ];
  const isPublicPath = publicPaths.includes(location.pathname);
  const isAppGate = location.pathname === ROUTE_PATTERNS.app;
  const isOnboarding = location.pathname === ROUTE_PATTERNS.onboarding;
  const shouldBeOnboarding = redirectPath === ROUTE_PATTERNS.onboarding;
  const isCorrectPath = location.pathname === (redirectPath as string);

  useEffect(() => {
    // Wait for the query to load
    if (redirectPath === undefined) return;

    // Small delay to allow auth state to stabilize after redirect back from OAuth provider
    const timer = setTimeout(() => {
      // If we are already at the recommended path, no redirection is needed
      if (isCorrectPath) return;

      // needsRedirect is true if:
      // - We have a recommended path AND
      // - (We are currently on a public page (signin/signup) OR
      // - We are on the /app gateway OR
      // - Our onboarding state (actual path vs recommended path) is mismatched)
      const needsRedirect =
        !!redirectPath && (isPublicPath || isAppGate || isOnboarding !== shouldBeOnboarding);

      if (needsRedirect) {
        navigate({ to: redirectPath, replace: true });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [
    redirectPath,
    isPublicPath,
    isAppGate,
    isOnboarding,
    shouldBeOnboarding,
    isCorrectPath,
    navigate,
  ]);

  // Loading state handling:
  // If redirectPath is undefined, we are still loading the query.
  // If redirectPath is null, it means the query finished but couldn't find a user/destination
  // (which is an inconsistent state if we are inside the <Authenticated> block).
  // In both cases, stay on the splash screen if we are on a protected route like /app.
  if (redirectPath === undefined || redirectPath === null) {
    if (isAppGate || isOnboarding) return <AppSplashScreen />;
    return null; // Public pages stay blank or show their children until auth resolves
  }

  // If a path needs redirecting but hasn't yet, show splash screen to avoid flicker
  const needsRedirect =
    !isCorrectPath && (isPublicPath || isAppGate || isOnboarding !== shouldBeOnboarding);

  if (needsRedirect) {
    return <AppSplashScreen />;
  }

  return <>{children}</>;
}
