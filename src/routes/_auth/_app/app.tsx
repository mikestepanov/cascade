import { createFileRoute } from "@tanstack/react-router";
import { AppSplashScreen } from "@/components/auth/AppSplashScreen";

export const Route = createFileRoute("/_auth/_app/app")({
  component: AppPage,
});

/**
 * AppPage - Minimal gateway component.
 * The SmartAuthGuard in the parent route layout handles the actual redirection.
 * This page just shows a splash screen if the guard hasn't triggered yet.
 */
function AppPage() {
  return <AppSplashScreen />;
}
