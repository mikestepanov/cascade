import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NixeloLogo } from "@/components/landing";

interface AuthPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthPageLayout({ title, subtitle, children }: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-[#0a0e17] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
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
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex flex-col items-center mb-6">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <NixeloLogo size={48} />
            </Link>
            <h1 className="text-2xl font-bold mt-4 mb-2">{title}</h1>
            <p className="text-gray-400 text-sm">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
