import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { AuthLink, AuthPageLayout, SignUpForm } from "@/components/auth";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/signup")({
  component: SignUpRoute,
  ssr: false,
});

function SignUpRoute() {
  return (
    <>
      <Authenticated>
        {/* Redirect to /dashboard which triggers company resolution in $companySlug route */}
        <Navigate to={ROUTES.dashboard("dashboard")} />
      </Authenticated>
      <Unauthenticated>
        <AuthPageLayout title="Create an account" subtitle="Sign up to get started with Nixelo">
          <SignUpForm />
          <div className="text-center text-sm text-ui-text-tertiary mt-4">
            <span>Already have an account? </span>
            <AuthLink to={ROUTES.signin}>Sign in</AuthLink>
          </div>
        </AuthPageLayout>
      </Unauthenticated>
    </>
  );
}
