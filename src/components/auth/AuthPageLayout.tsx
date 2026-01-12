import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NixeloLogo } from "@/components/landing";
import { ROUTE_PATTERNS } from "@/config/routes";
import { Typography } from "../ui/Typography";

interface AuthPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthPageLayout({ title, subtitle, children }: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-ui-bg-secondary dark:bg-ui-bg-primary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link
            to={ROUTE_PATTERNS.home}
            className="inline-flex items-center gap-2 text-ui-text-tertiary hover:text-white transition-colors text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Home
          </Link>
        </div>
        <div className="bg-ui-bg-primary dark:bg-ui-bg-secondary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex flex-col items-center mb-6">
            <Link to={ROUTE_PATTERNS.home} className="hover:opacity-80 transition-opacity">
              <NixeloLogo size={48} />
            </Link>
            <Typography variant="h2" className="text-2xl font-bold mt-4 mb-2">
              {title}
            </Typography>
            <Typography variant="muted" className="text-ui-text-tertiary">
              {subtitle}
            </Typography>
          </div>
          {children}
          <div className="mt-6 text-center text-xs text-ui-text-tertiary">
            By continuing, you acknowledge that you understand and agree to the{" "}
            <a href="/terms" className="underline hover:text-ui-text-secondary">
              Terms & Conditions
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-ui-text-secondary">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
