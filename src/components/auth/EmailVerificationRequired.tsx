import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { AuthLinkButton } from "./AuthLink";

export function EmailVerificationRequired() {
  const { signIn, signOut } = useAuthActions();
  const user = useQuery(api.auth.loggedInUser);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const email = user?.email || "";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set("email", email);
    formData.set("flow", "email-verification");

    void signIn("password", formData)
      .then(() => {
        toast.success("Email verified successfully!");
        // Page will refresh with verified user
      })
      .catch((_error) => {
        toast.error("Invalid code. Please try again.");
      })
      .finally(() => setSubmitting(false));
  };

  const handleResend = () => {
    setResending(true);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("flow", "email-verification");

    void signIn("password", formData)
      .then(() => {
        toast.success("Verification code sent!");
      })
      .catch(() => {
        toast.error("Could not resend code. Please try again.");
      })
      .finally(() => setResending(false));
  };

  const handleSignOut = () => {
    void signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-primary-dark p-4">
      <div className="w-full max-w-md bg-ui-bg-primary dark:bg-ui-bg-secondary-dark rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-brand-600 dark:text-brand-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Email icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
            Verify your email
          </h1>
          <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
            We sent a verification code to{" "}
            <strong className="text-ui-text-primary dark:text-ui-text-primary-dark">{email}</strong>
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            className="auth-input-field text-center text-xl tracking-widest"
            type="tel"
            inputMode="numeric"
            name="code"
            placeholder="Enter 8-digit code"
            required
            pattern="[0-9]{8}"
            maxLength={8}
          />
          <button className="auth-button" type="submit" disabled={submitting}>
            {submitting ? "Verifying..." : "Verify email"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <AuthLinkButton onClick={handleResend} disabled={resending}>
            {resending ? "Sending..." : "Didn't receive a code? Resend"}
          </AuthLinkButton>
          <div>
            <AuthLinkButton onClick={handleSignOut} variant="muted">
              Sign out and use a different account
            </AuthLinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}
