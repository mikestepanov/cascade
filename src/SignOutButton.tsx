"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      type="button"
      className="px-4 py-2 rounded bg-ui-bg-primary dark:bg-ui-bg-secondary-dark text-ui-text-secondary dark:text-ui-text-secondary-dark border border-ui-border-primary dark:border-ui-border-primary-dark font-semibold hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-tertiary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark transition-colors shadow-sm hover:shadow"
      onClick={() => void signOut()}
    >
      Sign out
    </button>
  );
}
