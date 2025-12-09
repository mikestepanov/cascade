import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { AuthLink, AuthPageLayout, PostAuthRedirect, SignUpForm } from "@/components/auth";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/signup")({
  component: SignUpRoute,
  ssr: false,
});

function SignUpRoute() {
  return (
    <>
      <Authenticated>
        <PostAuthRedirect />
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
