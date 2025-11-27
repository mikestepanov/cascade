"use client";
import { useState } from "react";
import {
  CredentialsForm,
  ForgotPasswordForm,
  ResetPasswordForm,
  GoogleSignInButton,
} from "./components/auth";

type AuthView = "credentials" | "forgot" | "reset";

export function SignInForm() {
  const [view, setView] = useState<AuthView>("credentials");
  const [resetEmail, setResetEmail] = useState("");

  if (view === "forgot") {
    return (
      <ForgotPasswordForm
        onCodeSent={(email) => {
          setResetEmail(email);
          setView("reset");
        }}
        onBack={() => setView("credentials")}
      />
    );
  }

  if (view === "reset") {
    return (
      <ResetPasswordForm
        email={resetEmail}
        onSuccess={() => {
          setView("credentials");
          setResetEmail("");
        }}
        onRetry={() => {
          setView("forgot");
          setResetEmail("");
        }}
      />
    );
  }

  return (
    <div className="w-full">
      <CredentialsForm onForgotPassword={() => setView("forgot")} />
      <div className="flex items-center justify-center my-3">
        <hr className="my-4 grow border-ui-border-primary dark:border-ui-border-primary-dark" />
        <span className="mx-4 text-ui-text-secondary dark:text-ui-text-secondary-dark">or</span>
        <hr className="my-4 grow border-ui-border-primary dark:border-ui-border-primary-dark" />
      </div>
      <GoogleSignInButton />
    </div>
  );
}
