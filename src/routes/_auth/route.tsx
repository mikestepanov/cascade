import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Authenticated, AuthLoading } from "convex/react";
import { AppSplashScreen } from "@/components/auth";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
  ssr: false,
});

/**
 * AuthLayout - Protected route layout using standard Convex auth components.
 *
 * - AuthLoading: Shows splash during initial auth check
 * - Authenticated: Gates content to logged-in users only
 *
 * Unauthenticated users will see nothing (blank) - the router handles
 * redirecting them to public routes.
 */
function AuthLayout() {
  return (
    <>
      <AuthLoading>
        <AppSplashScreen />
      </AuthLoading>
      <Authenticated>
        <Outlet />
      </Authenticated>
    </>
  );
}
