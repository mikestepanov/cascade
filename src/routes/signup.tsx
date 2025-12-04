import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { AuthLink, AuthPageLayout, SignUpForm } from "@/components/auth";

export const Route = createFileRoute("/signup")({
  component: SignUpRoute,
  ssr: false,
});

function SignUpRoute() {
  return (
    <>
      <Authenticated>
        <Navigate to="/dashboard" />
      </Authenticated>
      <Unauthenticated>
        <AuthPageLayout title="Create an account" subtitle="Sign up to get started with Nixelo">
          <SignUpForm />
          <div className="text-center text-sm text-gray-400 mt-4">
            <span>Already have an account? </span>
            <AuthLink to="/signin">Sign in</AuthLink>
          </div>
        </AuthPageLayout>
      </Unauthenticated>
    </>
  );
}
