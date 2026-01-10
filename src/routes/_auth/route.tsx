import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { SmartAuthGuard } from "@/components/auth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
  ssr: false,
});

function AuthLayout() {
  return (
    <>
      <AuthLoading>
        <LoadingContainer />
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

function LoadingContainer() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
      <LoadingSpinner size="lg" />
    </div>
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
    return <LoadingContainer />;
  }

  return <Navigate to={ROUTES.home} />;
}
