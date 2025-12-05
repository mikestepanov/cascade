import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { EmailVerificationForm } from "./EmailVerificationForm";
import { GoogleSignInButton } from "./GoogleSignInButton";

export function SignUpForm() {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [formReady, setFormReady] = useState(false);

  const handleShowEmailForm = () => {
    setShowEmailForm(true);
    setTimeout(() => setFormReady(true), 350);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formReady) return;
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const formEmail = formData.get("email") as string;
    formData.set("flow", "signUp");

    void signIn("password", formData)
      .then(() => {
        toast.success("Check your email for a verification code");
        setEmail(formEmail);
        setShowVerification(true);
      })
      .catch(() => {
        toast.error("Could not create account. Email may already be registered.");
        setSubmitting(false);
      });
  };

  if (showVerification) {
    return (
      <EmailVerificationForm
        email={email}
        onVerified={() => {
          // Auth state will update automatically
        }}
        onResend={() => {
          // Stay on verification view
        }}
      />
    );
  }

  const baseButtonStyles =
    "w-full px-4 py-3 rounded font-semibold transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3";

  const emailButtonStyles = `${baseButtonStyles} bg-ui-bg-primary dark:bg-ui-bg-primary-dark border-2 border-ui-border-primary dark:border-ui-border-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark hover:border-brand-500 dark:hover:border-brand-400`;

  const submitButtonStyles = `${baseButtonStyles} bg-brand-600 dark:bg-brand-500 border-2 border-brand-600 dark:border-brand-500 text-white hover:bg-brand-700 dark:hover:bg-brand-600 hover:border-brand-700 dark:hover:border-brand-600`;

  return (
    <div className="w-full">
      <GoogleSignInButton />
      <div className="flex items-center justify-center my-4">
        <hr className="grow border-gray-700" />
        <span className="mx-4 text-gray-500 text-sm">or</span>
        <hr className="grow border-gray-700" />
      </div>
      <form className="flex flex-col" onSubmit={handleSubmit}>
        <div
          className={`grid transition-all duration-300 ease-out ${
            showEmailForm ? "grid-rows-[1fr] opacity-100 mb-3" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden flex flex-col gap-form-field">
            <input
              className="auth-input-field"
              type="email"
              name="email"
              placeholder="Email"
              required={formReady}
            />
            <input
              className="auth-input-field"
              type="password"
              name="password"
              placeholder="Password"
              minLength={8}
              required={formReady}
            />
          </div>
        </div>
        <button
          type={showEmailForm ? "submit" : "button"}
          className={showEmailForm ? submitButtonStyles : emailButtonStyles}
          onClick={!showEmailForm ? handleShowEmailForm : undefined}
          disabled={submitting}
        >
          {!showEmailForm ? (
            <>
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <span>Continue with email</span>
            </>
          ) : submitting ? (
            "Creating account..."
          ) : (
            "Create account"
          )}
        </button>
      </form>
    </div>
  );
}
