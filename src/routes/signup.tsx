import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { SignUpForm } from "@/components/auth/SignUpForm";

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
            <Link
              to="/signin"
              className="text-brand-500 hover:text-brand-400 hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </AuthPageLayout>
      </Unauthenticated>
    </>
  );
}
