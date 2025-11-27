import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

interface EmailVerificationFormProps {
  email: string;
  onVerified: () => void;
  onResend: () => void;
}

export function EmailVerificationForm({ email, onVerified, onResend }: EmailVerificationFormProps) {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set("email", email);
    formData.set("flow", "email-verification");

    void signIn("password", formData)
      .then(() => {
        toast.success("Email verified successfully!");
        onVerified();
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
    formData.set("flow", "signUp");

    // Trigger resend by attempting signup again - Convex will resend the code
    void signIn("password", formData)
      .catch(() => {
        // Expected to "fail" since user exists, but code will be resent
      })
      .finally(() => {
        setResending(false);
        toast.success("Verification code resent!");
        onResend();
      });
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-4">
        Verify your email
      </h2>
      <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mb-4">
        We sent a verification code to <strong>{email}</strong>. Enter it below to continue.
      </p>
      <form className="flex flex-col gap-form-field" onSubmit={handleSubmit}>
        <input
          className="auth-input-field"
          type="text"
          name="code"
          placeholder="8-digit code"
          required
          pattern="[0-9]{8}"
          maxLength={8}
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? "Verifying..." : "Verify email"}
        </button>
        <button
          type="button"
          className="text-sm text-brand-600 dark:text-brand-500 hover:underline disabled:opacity-50"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? "Sending..." : "Didn't receive a code? Resend"}
        </button>
      </form>
    </div>
  );
}
