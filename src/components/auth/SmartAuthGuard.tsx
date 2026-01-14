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

  useEffect(() => {
    if (redirectPath === undefined || !redirectPath) return;

    // Redirect if:
    // 1. User is on a public page (home, signin, signup)
    // 2. User is on the Gateway (/app)
    // 3. User is on the wrong onboarding/dashboard state
    const needsRedirect = isPublicPath || isAppGate || isOnboarding !== shouldBeOnboarding;

    if (needsRedirect) {
      navigate({ to: redirectPath, replace: true });
    }
  }, [redirectPath, isPublicPath, isAppGate, isOnboarding, shouldBeOnboarding, navigate]);

  // Determine if we should show a loading spinner while redirecting
  // Fix: Ensure redirectPath is truthy (not null/undefined) before checking conditions
  const needsRedirect =
    !!redirectPath && (isPublicPath || isAppGate || isOnboarding !== shouldBeOnboarding);

  // Loading state
  if (redirectPath === undefined) {
    // If we are on the hidden gateway (/app), show the branding.
    // If we are on a public page, showing "Preparing workspace" is confusing,
    // so we just render nothing (or a very subtle spinner) to avoid the "flash".
    if (isAppGate) return <AppSplashScreen />;

    // For public pages, we can just return null or children.
    // Returning children might flash if they ARE logged in.
    // Returning <AppSplashScreen /> shows confusing text.
    // Detailed solution: We could pass a prop to make text optional, but for now,
    // let's just show the splash screen only on /app or when we are SURE we are redirecting.
    return null; // Render nothing while verifying auth on public pages (prevents flash)
  }

  if (needsRedirect) {
    return <AppSplashScreen />;
  }

  return <>{children}</>;
}
