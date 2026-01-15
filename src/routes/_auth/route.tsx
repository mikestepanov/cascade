import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AuthLoading } from "convex/react";
import { AppSplashScreen, SmartAuthGuard } from "@/components/auth";
import { ROUTE_PATTERNS } from "@/config/routes";

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
      <SmartAuthGuard>
        <Outlet />
      </SmartAuthGuard>
    </>
  );
}
