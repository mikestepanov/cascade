"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

type FlowType = "signIn" | "signUp" | "forgot" | "reset-verification";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<FlowType>("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Forgot password - step 1: enter email
  if (flow === "forgot") {
    return (
      <div className="w-full">
        <h2 className="text-xl font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-4">
          Reset your password
        </h2>
        <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mb-4">
          Enter your email and we'll send you a code to reset your password.
        </p>
        <form
          className="flex flex-col gap-form-field"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            const formData = new FormData(e.target as HTMLFormElement);
            const email = formData.get("email") as string;
            formData.set("flow", "reset");
            void signIn("password", formData)
              .then(() => {
                setResetEmail(email);
                setFlow("reset-verification");
                toast.success("Check your email for the reset code");
              })
              .catch((error) => {
                console.error("Reset error:", error);
                toast.error("Could not send reset code. Please check your email.");
              })
              .finally(() => setSubmitting(false));
          }}
        >
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
          <button
            type="button"
            className="text-sm text-brand-600 dark:text-brand-500 hover:underline"
            onClick={() => setFlow("signIn")}
          >
            Back to sign in
          </button>
        </form>
      </div>
    );
  }

  // Forgot password - step 2: enter code + new password
  if (flow === "reset-verification") {
    return (
      <div className="w-full">
        <h2 className="text-xl font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-4">
          Enter reset code
        </h2>
        <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mb-4">
          We sent a code to <strong>{resetEmail}</strong>. Enter it below with your new password.
        </p>
        <form
          className="flex flex-col gap-form-field"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            const formData = new FormData(e.target as HTMLFormElement);
            formData.set("email", resetEmail);
            formData.set("flow", "reset-verification");
            void signIn("password", formData)
              .then(() => {
                toast.success("Password reset successfully!");
                setFlow("signIn");
                setResetEmail("");
              })
              .catch((error) => {
                console.error("Verification error:", error);
                toast.error("Invalid code or password. Please try again.");
              })
              .finally(() => setSubmitting(false));
          }}
        >
          <input
            className="auth-input-field"
            type="text"
            name="code"
            placeholder="8-digit code"
            required
            pattern="[0-9]{8}"
            maxLength={8}
          />
          <input
            className="auth-input-field"
            type="password"
            name="newPassword"
            placeholder="New password"
            required
            minLength={8}
          />
          <button className="auth-button" type="submit" disabled={submitting}>
            {submitting ? "Resetting..." : "Reset password"}
          </button>
          <button
            type="button"
            className="text-sm text-brand-600 dark:text-brand-500 hover:underline"
            onClick={() => {
              setFlow("forgot");
              setResetEmail("");
            }}
          >
            Didn't receive a code? Try again
          </button>
        </form>
      </div>
    );
  }

  // Default: sign in / sign up form
  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-form-field"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          console.log("[SIGNIN] Form submitted, flow:", flow);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).then(() => { console.log("[SIGNIN] SUCCESS"); }).catch((error) => {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "Invalid password. Please try again.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "Could not sign in, did you mean to sign up?"
                  : "Could not sign up, did you mean to sign in?";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
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
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
        {flow === "signIn" && (
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-brand-600 dark:hover:text-brand-500 hover:underline"
              onClick={() => setFlow("forgot")}
            >
              Forgot password?
            </button>
          </div>
        )}
      </form>
      <div className="flex items-center justify-center my-3">
        <hr className="my-4 grow border-ui-border-primary dark:border-ui-border-primary-dark" />
        <span className="mx-4 text-ui-text-secondary dark:text-ui-text-secondary-dark">or</span>
        <hr className="my-4 grow border-ui-border-primary dark:border-ui-border-primary-dark" />
      </div>
      <button
        type="button"
        className="w-full px-4 py-3 rounded bg-ui-bg-primary dark:bg-ui-bg-primary-dark border-2 border-ui-border-primary dark:border-ui-border-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark font-semibold hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark transition-colors shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        onClick={() => void signIn("google")}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span>Sign in with Google</span>
      </button>
    </div>
  );
}
