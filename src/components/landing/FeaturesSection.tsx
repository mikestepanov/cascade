import { FileText, PanelsTopLeft, Users } from "lucide-react";
import { ArrowIcon } from "./icons";

export function FeaturesSection() {
  const features = [
    {
      icon: <FileText className="w-6 h-6 text-cyan-400" />,
      title: "Docs and issues, finally together",
      description:
        "No more tab-switching between your wiki and your task board. Link specs to tickets, discussions to sprints. All in one place.",
      gradient: "cyan" as const,
    },
    {
      icon: <Users className="w-6 h-6 text-teal-400" />,
      title: "Edit together, in real-time",
      description:
        "See who's typing, where they are, what changed. Collaborate like you're in the same room, even when you're not.",
      gradient: "teal" as const,
    },
    {
      icon: <PanelsTopLeft className="w-6 h-6 text-purple-400" />,
      title: "See everything. Miss nothing.",
      description:
        "One dashboard that actually makes sense. No more digging through 5 different tools to find what you need.",
      gradient: "purple" as const,
    },
  ];

  return (
    <section id="features" className="px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Stop juggling tools. Start shipping.
          </h2>
          <p className="text-ui-text-tertiary max-w-2xl mx-auto">
            Project management shouldn't feel like a second job.
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
        bg-linear-to-b from-gray-800/50 to-gray-900/50
        border border-gray-700/40
        backdrop-blur-md
        transition-all duration-300
        hover:shadow-xl ${glows[gradient]}
        hover:-translate-y-1
      `}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${gradients[gradient]} p-[2px] mb-5`}>
        <div className="w-full h-full rounded-xl bg-gray-900/90 flex items-center justify-center">
          {icon}
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
      <p className="text-ui-text-tertiary text-sm leading-relaxed mb-4">{description}</p>

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
