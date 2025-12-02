import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { NixeloLogo } from "@/components/landing";
import { SignInForm } from "@/SignInForm";

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
        <SignInPage />
      </Unauthenticated>
    </>
  );
}

function SignInPage() {
  return (
    <div className="min-h-screen w-full bg-[#0a0e17] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to home
        </Link>
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex flex-col items-center mb-6">
            <NixeloLogo size={48} />
            <h1 className="text-2xl font-bold mt-4 mb-2">Welcome back</h1>
            <p className="text-gray-400 text-sm">Sign in to your account to continue</p>
          </div>
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
