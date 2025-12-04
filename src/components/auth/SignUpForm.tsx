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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
          minLength={8}
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
      <div className="flex items-center justify-center my-4">
        <hr className="grow border-gray-700" />
        <span className="mx-4 text-gray-500 text-sm">or</span>
        <hr className="grow border-gray-700" />
      </div>
      <GoogleSignInButton />
    </div>
  );
}
