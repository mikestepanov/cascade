import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { AuthLink, AuthPageLayout, SignInForm } from "@/components/auth";

export const Route = createFileRoute("/signin")({
  component: SignInRoute,
  ssr: false,
});

function SignInRoute() {
  return (
    <>
      <Authenticated>
        <Navigate to="/dashboard" />
      </Authenticated>
      <Unauthenticated>
        <AuthPageLayout title="Welcome back" subtitle="Sign in to your account to continue">
          <SignInForm />
          <div className="text-center text-sm text-gray-400 mt-4">
            <span>Don't have an account? </span>
            <AuthLink to="/signup">Sign up</AuthLink>
          </div>
        </AuthPageLayout>
      </Unauthenticated>
    </>
  );
}
