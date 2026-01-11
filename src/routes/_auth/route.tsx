import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { AppSplashScreen, SmartAuthGuard } from "@/components/auth";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
  ssr: false,
});

function AuthLayout() {
  return (
    <>
      <AuthLoading>
        {/* Use the premium splash screen for the initial auth check */}
        <AppSplashScreen />
      </AuthLoading>
      <Authenticated>
        <SmartAuthGuard>
          <Outlet />
        </SmartAuthGuard>
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedGuard />
      </Unauthenticated>
    </>
  );
}

/**
 * UnauthenticatedGuard - Prevents premature redirects during E2E token hydration
 */
function UnauthenticatedGuard() {
  // In E2E tests, we might have injected a token into LocalStorage that the Convex client
  // hasn't processed yet. If we see a token, we should wait and show a loading spinner
  // instead of immediately redirecting to home.
  const hasToken =
    typeof window !== "undefined" &&
    Object.keys(window.localStorage).some((k) => k.includes("__convexAuthJWT_"));

  if (hasToken) {
    return <AppSplashScreen />;
  }

  return <Navigate to={ROUTES.home} />;
}
