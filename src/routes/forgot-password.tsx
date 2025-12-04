import { useAuthActions } from "@convex-dev/auth/react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordRoute,
  ssr: false,
});

function ForgotPasswordRoute() {
  return (
    <>
      <Authenticated>
        <Navigate to="/dashboard" />
      </Authenticated>
      <Unauthenticated>
        <ForgotPasswordPage />
      </Unauthenticated>
    </>
  );
}

function ForgotPasswordPage() {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [showReset, setShowReset] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const formEmail = formData.get("email") as string;
    formData.set("flow", "reset");

    void signIn("password", formData)
      .then(() => {
        setEmail(formEmail);
        setShowReset(true);
        toast.success("If an account exists, you'll receive a reset code");
      })
      .catch(() => {
        // Don't reveal if email exists - show same message either way
        setEmail(formEmail);
        setShowReset(true);
        toast.success("If an account exists, you'll receive a reset code");
      })
      .finally(() => setSubmitting(false));
  };

  if (showReset) {
    return (
      <AuthPageLayout title="Reset password" subtitle="Enter the code from your email">
        <ResetPasswordForm
          email={email}
          onSuccess={() => {
            toast.success("Password reset successfully!");
            // Will redirect via auth state
          }}
          onRetry={() => {
            setShowReset(false);
            setEmail("");
          }}
        />
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset code"
    >
      <form className="flex flex-col gap-form-field" onSubmit={handleSubmit}>
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send reset code"}
        </button>
      </form>
      <div className="text-center text-sm text-gray-400 mt-4">
        <Link to="/signin" className="text-brand-500 hover:text-brand-400 hover:underline">
          Back to sign in
        </Link>
      </div>
    </AuthPageLayout>
  );
}
