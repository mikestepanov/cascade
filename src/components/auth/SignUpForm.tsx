import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { ROUTE_PATTERNS } from "@/config/routes";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Input } from "../ui/form/Input";
import { EmailVerificationForm } from "./EmailVerificationForm";
import { GoogleAuthButton } from "./GoogleAuthButton";

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

  return (
    <div className="w-full">
      <GoogleAuthButton redirectTo={ROUTE_PATTERNS.app} text="Sign up with Google" />
      <div className="flex items-center justify-center my-4">
        <hr className="grow border-ui-border-primary" />
        <span className="mx-4 text-ui-text-secondary text-sm">or</span>
        <hr className="grow border-ui-border-primary" />
      </div>
      <form className="flex flex-col" onSubmit={handleSubmit} data-form-ready={formReady}>
        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            showEmailForm ? "grid-rows-[1fr] opacity-100 mb-3" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden flex flex-col gap-form-field">
            <Input type="email" name="email" placeholder="Email" required={formReady} />
            <Input
              type="password"
              name="password"
              placeholder="Password"
              minLength={8}
              required={formReady}
            />
          </div>
        </div>
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
            "Creating account..."
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </div>
  );
}
