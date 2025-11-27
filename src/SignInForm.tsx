"use client";
import { useState } from "react";
import {
  CredentialsForm,
  EmailVerificationForm,
  ForgotPasswordForm,
  GoogleSignInButton,
  ResetPasswordForm,
} from "./components/auth";

type AuthView = "credentials" | "forgot" | "reset" | "verify";

export function SignInForm() {
  const [view, setView] = useState<AuthView>("credentials");
  const [email, setEmail] = useState("");

  if (view === "forgot") {
    return (
      <ForgotPasswordForm
        onCodeSent={(sentEmail) => {
          setEmail(sentEmail);
          setView("reset");
        }}
        onBack={() => setView("credentials")}
      />
    );
  }

  if (view === "reset") {
    return (
      <ResetPasswordForm
        email={email}
        onSuccess={() => {
          setView("credentials");
          setEmail("");
        }}
        onRetry={() => {
          setView("forgot");
          setEmail("");
        }}
      />
    );
  }

  if (view === "verify") {
    return (
      <EmailVerificationForm
        email={email}
        onVerified={() => {
          setView("credentials");
          setEmail("");
        }}
        onResend={() => {
          // Stay on verify view, just resend
        }}
      />
    );
  }

  return (
    <div className="w-full">
      <CredentialsForm
        onForgotPassword={() => setView("forgot")}
        onSignUpNeedsVerification={(signUpEmail) => {
          setEmail(signUpEmail);
          setView("verify");
        }}
      />
      <div className="flex items-center justify-center my-3">
        <hr className="my-4 grow border-ui-border-primary dark:border-ui-border-primary-dark" />
        <span className="mx-4 text-ui-text-secondary dark:text-ui-text-secondary-dark">or</span>
        <hr className="my-4 grow border-ui-border-primary dark:border-ui-border-primary-dark" />
      </div>
      <GoogleSignInButton />
    </div>
  );
}
