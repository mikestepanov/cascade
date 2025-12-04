import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLinkButton } from "./AuthLink";

interface ForgotPasswordFormProps {
  onCodeSent: (email: string) => void;
  onBack: () => void;
}

export function ForgotPasswordForm({ onCodeSent, onBack }: ForgotPasswordFormProps) {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    formData.set("flow", "reset");

    void signIn("password", formData)
      .then(() => {
        onCodeSent(email);
        toast.success("Check your email for the reset code");
      })
      .catch((_error) => {
        toast.error("Could not send reset code. Please check your email.");
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-4">
        Reset your password
      </h2>
      <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mb-4">
        Enter your email and we'll send you a code to reset your password.
      </p>
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
        <AuthLinkButton onClick={onBack}>Back to sign in</AuthLinkButton>
      </form>
    </div>
  );
}
