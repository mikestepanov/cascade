import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/config/routes";
import { Button } from "../ui/Button";
import { Input } from "../ui/form/Input";
import { AuthLinkButton } from "./AuthLink";
import { GoogleAuthButton } from "./GoogleAuthButton";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
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
    formData.set("flow", "signIn");

    void signIn("password", formData)
      .then(() => {
        // Redirect to /app gateway to trigger SmartAuthGuard logic
        navigate({ to: ROUTES.app });
      })
      .catch((error) => {
        const message = error.message.includes("Invalid password")
          ? "Invalid password. Please try again."
          : "Could not sign in. Please check your credentials.";
        toast.error(message);
        setSubmitting(false);
      });
  };

  return (
    <div className="w-full">
      <GoogleAuthButton redirectTo={ROUTES.app} text="Sign in with Google" />
      <div className="flex items-center justify-center my-4">
        <hr className="grow border-ui-border-primary dark:border-ui-border-primary-dark" />
        <span className="mx-4 text-ui-text-secondary text-sm">or</span>
        <hr className="grow border-ui-border-primary dark:border-ui-border-primary-dark" />
      </div>
      <form className="flex flex-col" onSubmit={handleSubmit} data-form-ready={formReady}>
        <div
          className={`grid transition-all duration-300 ease-out ${
            showEmailForm ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden flex flex-col gap-form-field">
            <Input type="email" name="email" placeholder="Email" required={formReady} />
            <Input type="password" name="password" placeholder="Password" required={formReady} />
          </div>
        </div>
        {showEmailForm && (
          <div className="text-right mb-3">
            <AuthLinkButton onClick={() => navigate({ to: ROUTES.forgotPassword })}>
              Forgot password?
            </AuthLinkButton>
          </div>
        )}
        <Button
          type={showEmailForm ? "submit" : "button"}
          variant={showEmailForm ? "primary" : "secondary"}
          size="lg"
          className="w-full"
          onClick={!showEmailForm ? handleShowEmailForm : undefined}
          disabled={submitting}
        >
          {!showEmailForm ? (
            <div className="flex items-center gap-3">
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
            </div>
          ) : submitting ? (
            "Signing in..."
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </div>
  );
}
