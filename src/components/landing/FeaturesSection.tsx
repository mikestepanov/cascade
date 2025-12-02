import { ArrowIcon, ClarityIcon, TimeIcon, WorkflowIcon } from "./icons";

export function FeaturesSection() {
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
