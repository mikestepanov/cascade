import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";
import { NixeloLogo } from "../icons";

export function NavHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-lg border-b border-white/5" />

      <nav className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
        <Link
          to={ROUTES.home}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          {/* Fixed icon container to prevent sizing issues */}
          {/* Clean icon without background */}
          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
            <NixeloLogo size={32} />
          </div>
          <span className="text-lg font-bold text-white tracking-wide">Nixelo</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center justify-center gap-10 absolute left-1/2 -translate-x-1/2">
          {["Features", "Pricing", "Resources"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-teal-400 transition-all group-hover:w-full opacity-0 group-hover:opacity-100" />
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6">
          <Link
            to={ROUTES.signin}
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            to={ROUTES.signup}
            className="px-5 py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors shadow-lg shadow-white/5"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
