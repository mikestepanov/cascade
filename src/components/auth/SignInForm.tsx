import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { GoogleSignInButton } from "./GoogleSignInButton";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set("flow", "signIn");

    void signIn("password", formData)
      .then(() => {
        // Auth state will update automatically and redirect
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
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="text-center mt-3">
        <button
          type="button"
          className="text-sm text-gray-400 hover:text-brand-500 hover:underline"
          onClick={() => navigate({ to: "/forgot-password" })}
        >
          Forgot password?
        </button>
      </div>
      <div className="flex items-center justify-center my-4">
        <hr className="grow border-gray-700" />
        <span className="mx-4 text-gray-500 text-sm">or</span>
        <hr className="grow border-gray-700" />
      </div>
      <GoogleSignInButton />
    </div>
  );
}
