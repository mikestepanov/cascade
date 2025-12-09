import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { AuthLink, AuthPageLayout, PostAuthRedirect, SignInForm } from "@/components/auth";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/signin")({
  component: SignInRoute,
  ssr: false,
});

function SignInRoute() {
  return (
    <>
      <Authenticated>
        <PostAuthRedirect />
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
