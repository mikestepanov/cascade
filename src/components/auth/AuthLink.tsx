import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const linkStyles =
  "text-sm text-brand-500 hover:text-brand-400 hover:underline font-medium cursor-pointer transition-colors";

const mutedLinkStyles =
  "text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark hover:text-ui-text-secondary dark:hover:text-ui-text-secondary-dark hover:underline cursor-pointer transition-colors";

interface AuthLinkProps {
  to: string;
  children: ReactNode;
  className?: string;
}

/**
 * Styled link for auth pages (Sign up, Sign in, etc.)
 * Uses TanStack Router Link
 */
export function AuthLink({ to, children, className = "" }: AuthLinkProps) {
  return (
    <Link to={to} className={`${linkStyles} ${className}`}>
      {children}
    </Link>
  );
}

interface AuthLinkButtonProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "muted";
}

/**
 * Styled button that looks like a link for auth pages
 * For actions that need onClick instead of navigation
 */
export function AuthLinkButton({
  onClick,
  children,
  className = "",
  disabled = false,
  variant = "default",
}: AuthLinkButtonProps) {
  const baseStyles = variant === "muted" ? mutedLinkStyles : linkStyles;
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${disabledStyles} ${className}`}
    >
      {children}
    </button>
  );
}
