import { useEffect, useState } from "react";
import { SignInForm } from "../SignInForm";

// Nixelo Landing Page - Unified dark theme
// All sections flow top to bottom

export function NixeloLanding() {
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin) {
    return <LoginSection onBack={() => setShowLogin(false)} />;
  }

  return (
    <div className="min-h-screen w-screen bg-[#0a0e17] text-white overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Circuit Flow Lines - spans full page */}
      <CircuitFlowLines />

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <NavHeader onGetStarted={() => setShowLogin(true)} />

        {/* Hero Section */}
        <HeroSection onGetStarted={() => setShowLogin(true)} />

        {/* Feature Cards Section */}
        <FeaturesSection />

        {/* Why Choose Section */}
        <WhyChooseSection />

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

// ============================================
// LOGIN SECTION
// ============================================
function LoginSection({ onBack }: { onBack: () => void }) {
  // Import and render the actual SignInForm
  // We need to dynamically import it to avoid circular deps
  return (
    <div className="min-h-screen w-screen bg-[#0a0e17] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to home
        </button>
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
          <div className="text-center mb-6">
            <NixeloLogo size={48} />
            <h1 className="text-2xl font-bold mt-4 mb-2">Welcome back</h1>
            <p className="text-gray-400 text-sm">Sign in to your account to continue</p>
          </div>
          <SignInForm />
        </div>
      </div>
    </div>
  );
}

// ============================================
// NAVIGATION
// ============================================
function NavHeader({ onGetStarted }: { onGetStarted: () => void }) {
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

// ============================================
// HERO SECTION
// ============================================
function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
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
          <button
            type="button"
            onClick={onGetStarted}
            className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full text-base font-medium text-black hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Get Started Free
          </button>
          <button
            type="button"
            className="group px-8 py-3.5 bg-transparent border border-gray-600 rounded-full text-base font-medium text-gray-300 hover:border-gray-500 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            Watch Demo
            <PlayIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

// ============================================
// FEATURES SECTION
// ============================================
function FeaturesSection() {
  const features = [
    {
      icon: <WorkflowIcon />,
      title: "Seamless Workflow Automation",
      description:
        "Automate repetitive tasks and streamline approvals to keep your projects moving without manual bottlenecks.",
      gradient: "cyan" as const,
    },
    {
      icon: <TimeIcon />,
      title: "Intelligent Time Tracking",
      description:
        "Effortlessly capture every billable minute with smart detection that runs quietly in the background.",
      gradient: "teal" as const,
    },
    {
      icon: <ClarityIcon />,
      title: "Integrated Project Clarity",
      description:
        "Gain real-time visibility across all initiatives with unified dashboards that surface what matters most.",
      gradient: "purple" as const,
    },
  ];

  return (
    <section id="features" className="px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to succeed</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Powerful features designed to help teams work smarter, not harder.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: "cyan" | "teal" | "purple";
}) {
  const gradients = {
    cyan: "from-cyan-500 to-teal-500",
    teal: "from-teal-500 to-emerald-500",
    purple: "from-purple-500 to-pink-500",
  };

  const glows = {
    cyan: "hover:shadow-cyan-500/20 hover:border-cyan-500/40",
    teal: "hover:shadow-teal-500/20 hover:border-teal-500/40",
    purple: "hover:shadow-purple-500/20 hover:border-purple-500/40",
  };

  return (
    <div
      className={`
        group relative p-6 rounded-2xl
        bg-gradient-to-b from-gray-800/50 to-gray-900/50
        border border-gray-700/40
        backdrop-blur-md
        transition-all duration-300
        hover:shadow-xl ${glows[gradient]}
        hover:-translate-y-1
      `}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[gradient]} p-[1px] mb-5`}>
        <div className="w-full h-full rounded-xl bg-gray-900/90 flex items-center justify-center">
          {icon}
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed mb-4">{description}</p>

      {/* Link */}
      <a
        href="#"
        className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        Learn more
        <ArrowIcon className="w-4 h-4" />
      </a>
    </div>
  );
}

// ============================================
// WHY CHOOSE SECTION
// ============================================
function WhyChooseSection() {
  const stats = [
    { value: 30, label: "Faster project delivery", color: "cyan" as const },
    { value: 10, label: "Reduction in overhead", color: "teal" as const },
    { value: 95, label: "Team adoption rate", color: "purple" as const },
    { value: 95, label: "Customer satisfaction", color: "emerald" as const },
  ];

  return (
    <section className="px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-b from-gray-800/30 to-gray-900/30 border border-gray-700/30 rounded-3xl p-12 backdrop-blur-sm">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Nixelo?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Join thousands of teams who have transformed their workflow
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <StatItem key={stat.label} {...stat} delay={index * 150} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatItem({
  value,
  label,
  color,
  delay,
}: {
  value: number;
  label: string;
  color: "cyan" | "teal" | "purple" | "emerald";
  delay: number;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  const colors = {
    cyan: { text: "text-cyan-400", bar: "bg-cyan-500", glow: "shadow-cyan-500/50" },
    teal: { text: "text-teal-400", bar: "bg-teal-500", glow: "shadow-teal-500/50" },
    purple: { text: "text-purple-400", bar: "bg-purple-500", glow: "shadow-purple-500/50" },
    emerald: { text: "text-emerald-400", bar: "bg-emerald-500", glow: "shadow-emerald-500/50" },
  };

  return (
    <div className="text-center">
      <div className={`text-4xl md:text-5xl font-bold mb-2 ${colors[color].text}`}>{value}%</div>
      <p className="text-gray-400 text-sm mb-4">{label}</p>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color].bar} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// FOOTER
// ============================================
function Footer() {
  return (
    <footer className="px-6 py-16 border-t border-gray-800/50">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <NixeloLogo />
              <span className="text-xl font-semibold">nixelo</span>
            </div>
            <p className="text-gray-400 text-sm max-w-xs">
              Revolutionizing project management with intelligent automation and seamless
              collaboration.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Product</h4>
            <ul className="space-y-2">
              {["Features", "Pricing", "Integrations", "Changelog"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-2">
              {["About", "Blog", "Careers", "Contact"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Resources</h4>
            <ul className="space-y-2">
              {["Documentation", "Help Center", "API Reference", "Status"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">© 2025 Nixelo. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
              Privacy
            </a>
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
              Terms
            </a>
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// CIRCUIT FLOW LINES SVG
// ============================================
function CircuitFlowLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
      preserveAspectRatio="xMidYMin slice"
      fill="none"
    >
      <defs>
        <linearGradient id="flowGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
          <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="flowGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
          <stop offset="50%" stopColor="#a855f7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="flowGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0" />
          <stop offset="50%" stopColor="#10b981" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
        <filter id="flowGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#flowGlow)">
        {/* Horizontal flow lines */}
        <path
          d="M0,150 Q200,130 400,170 T800,140 T1200,180 T1600,150 T2000,170"
          stroke="url(#flowGrad1)"
          strokeWidth="1.5"
          className="animate-flow-1"
        />
        <path
          d="M0,300 Q250,280 500,320 T1000,290 T1500,330 T2000,300"
          stroke="url(#flowGrad2)"
          strokeWidth="1.5"
          className="animate-flow-2"
        />
        <path
          d="M0,450 Q300,420 600,460 T1200,430 T1800,470 T2400,440"
          stroke="url(#flowGrad3)"
          strokeWidth="1.5"
          className="animate-flow-3"
        />

        {/* Vertical connectors */}
        <path
          d="M400,170 L400,280"
          stroke="#06b6d4"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.3"
        />
        <path
          d="M800,140 L800,290"
          stroke="#8b5cf6"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.3"
        />
        <path
          d="M1000,290 L1000,430"
          stroke="#a855f7"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.3"
        />
      </g>

      {/* Animated dots */}
      <circle r="3" fill="#06b6d4" filter="url(#flowGlow)">
        <animateMotion
          dur="8s"
          repeatCount="indefinite"
          path="M0,150 Q200,130 400,170 T800,140 T1200,180 T1600,150 T2000,170"
        />
      </circle>
      <circle r="2.5" fill="#a855f7" filter="url(#flowGlow)">
        <animateMotion
          dur="10s"
          repeatCount="indefinite"
          path="M0,300 Q250,280 500,320 T1000,290 T1500,330 T2000,300"
        />
      </circle>
      <circle r="2.5" fill="#10b981" filter="url(#flowGlow)">
        <animateMotion
          dur="9s"
          repeatCount="indefinite"
          path="M0,450 Q300,420 600,460 T1200,430 T1800,470 T2400,440"
        />
      </circle>

      {/* Node points */}
      <g filter="url(#flowGlow)">
        <circle cx="400" cy="170" r="4" fill="#06b6d4" />
        <circle cx="800" cy="140" r="4" fill="#8b5cf6" />
        <circle cx="500" cy="320" r="4" fill="#a855f7" />
        <circle cx="1000" cy="290" r="4" fill="#14b8a6" />
        <circle cx="600" cy="460" r="4" fill="#10b981" />
      </g>
    </svg>
  );
}

// ============================================
// ICONS
// ============================================
function NixeloLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="url(#nixeloGrad)" />
      <path d="M10 12L16 8L22 12V20L16 24L10 20V12Z" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="16" cy="16" r="2.5" fill="white" />
      <defs>
        <linearGradient id="nixeloGrad" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#06b6d4" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function WorkflowIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="1.5">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="19" cy="12" r="2" />
      <path d="M7 12h3M14 6h2.5a1.5 1.5 0 011.5 1.5v3M14 18h2.5a1.5 1.5 0 001.5-1.5v-3" />
    </svg>
  );
}

function TimeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 8h18M8 2v4M16 2v4" />
      <circle cx="12" cy="14" r="2" />
    </svg>
  );
}

function ClarityIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 3l10 5-10 5V3z" />
    </svg>
  );
}

export default NixeloLanding;
