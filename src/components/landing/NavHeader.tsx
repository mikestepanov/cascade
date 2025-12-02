import { NixeloLogo } from "./icons";

interface NavHeaderProps {
  onGetStarted: () => void;
}

export function NavHeader({ onGetStarted }: NavHeaderProps) {
  return (
    <header className="px-6 py-5">
      <nav className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NixeloLogo />
          <span className="text-xl font-semibold text-white">nixelo</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "Pricing", "Resources"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
          <button
            type="button"
            onClick={onGetStarted}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Login
          </button>
        </div>

        <button
          type="button"
          onClick={onGetStarted}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full text-sm font-medium text-black hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
        >
          Get Started
        </button>
      </nav>
    </header>
  );
}
