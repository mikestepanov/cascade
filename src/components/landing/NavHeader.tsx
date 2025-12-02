import { Link } from "@tanstack/react-router";
import { NixeloLogo } from "./icons";

export function NavHeader() {
  return (
    <header className="px-6 py-5">
      <nav className="max-w-6xl mx-auto flex items-center justify-between relative">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <NixeloLogo />
          <span className="text-xl font-semibold text-white">Nixelo</span>
        </Link>

        <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 -translate-x-1/2">
          {["Features", "Pricing", "Resources"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link to="/signin" className="text-sm text-gray-400 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link
            to="/signin"
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full text-sm font-medium text-black hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
