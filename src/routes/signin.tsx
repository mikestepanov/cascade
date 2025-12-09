import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { AuthLink, AuthPageLayout, SignInForm } from "@/components/auth";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/signin")({
  component: SignInRoute,
  ssr: false,
});

function SignInRoute() {
  return (
    <>
      <Authenticated>
        {/* Redirect to /dashboard which triggers company resolution in $companySlug route */}
        <Navigate to={ROUTES.dashboard("dashboard")} />
      </Authenticated>
      <Unauthenticated>
        <AuthPageLayout title="Welcome back" subtitle="Sign in to your account to continue">
          <SignInForm />
          <div className="text-center text-sm text-ui-text-tertiary mt-4">
            <span>Don't have an account? </span>
            <AuthLink to={ROUTES.signup}>Sign up</AuthLink>
          </div>
        </AuthPageLayout>
      </Unauthenticated>
    </>
  );
}
