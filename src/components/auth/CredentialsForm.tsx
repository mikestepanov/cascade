import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

interface CredentialsFormProps {
  onForgotPassword: () => void;
}

export function CredentialsForm({ onForgotPassword }: CredentialsFormProps) {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set("flow", flow);

    void signIn("password", formData)
      .then(() => {
        // Success - auth state will update automatically
      })
      .catch((error) => {
        let message = "";
        if (error.message.includes("Invalid password")) {
          message = "Invalid password. Please try again.";
        } else {
          message =
            flow === "signIn"
              ? "Could not sign in, did you mean to sign up?"
              : "Could not sign up, did you mean to sign in?";
        }
        toast.error(message);
        setSubmitting(false);
      });
  };

  const toggleFlow = () => setFlow(flow === "signIn" ? "signUp" : "signIn");

  return (
    <form className="flex flex-col gap-form-field" onSubmit={handleSubmit}>
      <input
        className="auth-input-field"
        type="email"
        name="email"
        placeholder="Email"
        required
      />
      <input
        className="auth-input-field"
        type="password"
        name="password"
        placeholder="Password"
        required
      />
      <button className="auth-button" type="submit" disabled={submitting}>
        {flow === "signIn" ? "Sign in" : "Sign up"}
      </button>
      <div className="text-center text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
        <span>{flow === "signIn" ? "Don't have an account? " : "Already have an account? "}</span>
        <button
          type="button"
          className="text-brand-600 dark:text-brand-500 hover:text-brand-700 dark:hover:text-brand-600 hover:underline font-medium cursor-pointer"
          onClick={toggleFlow}
        >
          {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
        </button>
      </div>
      {flow === "signIn" && (
        <div className="text-center">
          <button
            type="button"
            className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-brand-600 dark:hover:text-brand-500 hover:underline"
            onClick={onForgotPassword}
          >
            Forgot password?
          </button>
        </div>
      )}
    </form>
  );
}
