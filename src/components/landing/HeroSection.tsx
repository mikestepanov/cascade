import { Link } from "@tanstack/react-router";
import { PlayIcon } from "./icons";

export function HeroSection() {
  return (
    <section className="px-6 pt-16 pb-24">
      <div className="max-w-4xl mx-auto text-center">
        {/* Tag */}
        <div className="flex justify-center mb-8">
          <span className="px-4 py-2 rounded-full border border-gray-700/50 text-xs text-gray-400 bg-gray-900/30 backdrop-blur-sm">
            Project Management · Time Tracking
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
          Revolutionize Your Workflow.
          <br />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Harmonize Your Team.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
          Experience the future of project management with integrated tracking, automation, and
          collaboration.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/signin"
            className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full text-base font-medium text-black hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Get Started Free
          </Link>
          <a
            href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            target="_blank"
            rel="noopener noreferrer"
            className="group px-8 py-3.5 bg-transparent border border-gray-600 rounded-full text-base font-medium text-gray-300 hover:border-gray-500 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            Watch Demo
            <PlayIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
