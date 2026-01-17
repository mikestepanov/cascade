import { api } from "@convex/_generated/api";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { ROUTE_PATTERNS } from "@/config/routes";
import { AppSplashScreen } from "./AppSplashScreen";

const PUBLIC_PATHS = [
  ROUTE_PATTERNS.home as string,
  ROUTE_PATTERNS.signin as string,
  ROUTE_PATTERNS.signup as string,
  ROUTE_PATTERNS.forgotPassword as string,
  ROUTE_PATTERNS.invite as string,
];

/**
 * Checks if a pathname matches any of the public path patterns.
 * Handles both literal paths and parameterized paths (e.g., /invite/$token).
 */
function isPathPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((pattern) => {
    if (pattern === pathname) return true;
    if (pattern.includes("$")) {
      // Simple regex conversion: replace $param with [^/]+
      const regexPattern = pattern.replace(/\$[a-zA-Z0-9]+/g, "[^/]+");
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(pathname);
    }
    return false;
  });
}

/**
 * SmartAuthGuard - Centralized "bouncer" for authenticated routes.
 * It ensures the user is on the correct page based on their onboarding and organization status.
 */
export function SmartAuthGuard({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = useQuery(api.auth.getRedirectDestination);

  const isPublicPath = isPathPublic(location.pathname);
  const isAppGate = location.pathname === ROUTE_PATTERNS.app;
  const isOnboarding = location.pathname === ROUTE_PATTERNS.onboarding;
  const shouldBeOnboarding = redirectPath === ROUTE_PATTERNS.onboarding;
  const isCorrectPath = location.pathname === (redirectPath as string);

  // Check for any sign of a Convex auth token in local storage
  // This is critical for E2E tests where the token is injected directly
  const hasToken =
    typeof window !== "undefined" &&
    Object.keys(window.localStorage).some((k) => k.includes("convexAuth"));

  useEffect(() => {
    // Wait for the query to load its initial state
    if (redirectPath === undefined) return;

    // Case 1: User is logged in but on the wrong path (e.g., at /signin or wrong onboarding step)
    if (redirectPath !== null && !isCorrectPath) {
      const needsAppRedirect = isPublicPath || isAppGate || isOnboarding !== shouldBeOnboarding;
      if (needsAppRedirect) {
        navigate({ to: redirectPath, replace: true });
      }
      return;
    }

    // Case 2: User is NOT logged in but trying to access a protected route
    if (redirectPath === null && !isPublicPath && !hasToken) {
      navigate({ to: ROUTE_PATTERNS.home, replace: true });
    }
  }, [
    redirectPath,
    isPublicPath,
    isAppGate,
    isOnboarding,
    shouldBeOnboarding,
    isCorrectPath,
    hasToken,
    navigate,
  ]);

  // Loading state handling:
  // Show splash screen while we are waiting for the bouncer to decide
  if (redirectPath === undefined || (redirectPath === null && hasToken)) {
    if (isAppGate || isOnboarding || !isPublicPath) return <AppSplashScreen />;
    return null; // Don't show anything on landing page during load
  }

  // If user is unauthenticated
  if (redirectPath === null) {
    if (isPublicPath) return <>{children}</>;
    // While the effect is navigating them home, show splash
    return <AppSplashScreen />;
  }

  // If user is authenticated but needs redirecting (e.g. from /signin to /dashboard)
  const isWrongPath =
    !isCorrectPath && (isPublicPath || isAppGate || isOnboarding !== shouldBeOnboarding);
  if (isWrongPath) {
    return <AppSplashScreen />;
  }

  // All cleared - render the requested page
  return <>{children}</>;
}
