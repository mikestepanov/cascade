import { Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { ROUTES } from "@/config/routes";
import { NixeloLogo } from "./icons";

export function NavHeader() {
  return (
    <header className="px-6 py-5">
      <nav className="max-w-6xl mx-auto flex items-center justify-between relative">
        <Link
          to={ROUTES.home}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <NixeloLogo />
          <span className="text-xl font-semibold text-white">Nixelo</span>
        </Link>

        <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 -translate-x-1/2">
          {["Features", "Pricing", "Resources"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm text-ui-text-tertiary hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Unauthenticated>
            <Link
              to={ROUTES.signin}
              className="text-sm text-ui-text-tertiary hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              to={ROUTES.signup}
              className="px-5 py-2.5 bg-linear-to-r from-cyan-500 to-teal-400 rounded-full text-sm font-medium text-black hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              Get Started
            </Link>
          </Unauthenticated>
          <Authenticated>
            <Link
              to={ROUTES.app}
              className="px-5 py-2.5 bg-linear-to-r from-cyan-500 to-teal-400 rounded-full text-sm font-medium text-black hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              Go to App
            </Link>
          </Authenticated>
        </div>
      </nav>
    </header>
  );
}
