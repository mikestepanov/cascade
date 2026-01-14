import { FileText, PanelsTopLeft, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Typography } from "../ui/Typography";
import { ArrowIcon } from "./icons";

export function FeaturesSection() {
  const features = [
    {
      icon: <FileText className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
      title: "Docs and issues, finally together",
      description:
        "No more tab-switching between your wiki and your task board. Link specs to tickets, discussions to sprints. All in one place.",
      gradient: "cyan" as const,
    },
    {
      icon: <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
      title: "Edit together, in real-time",
      description:
        "See who's typing, where they are, what changed. Collaborate like you're in the same room, even when you're not.",
      gradient: "teal" as const,
    },
    {
      icon: <PanelsTopLeft className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      title: "See everything. Miss nothing.",
      description:
        "One dashboard that actually makes sense. No more digging through 5 different tools to find what you need.",
      gradient: "purple" as const,
    },
  ];

  return (
    <section id="features" className="px-6 py-24 transition-colors">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Typography
            variant="h2"
            className="text-3xl md:text-4xl font-bold mb-4 text-ui-text-primary"
          >
            Stop juggling tools. Start shipping.
          </Typography>
          <Typography variant="lead" className="text-ui-text-secondary max-w-2xl mx-auto">
            Project management shouldn't feel like a second job.
          </Typography>
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

  const borderGlows = {
    cyan: "group-hover:border-cyan-500/30",
    teal: "group-hover:border-teal-500/30",
    purple: "group-hover:border-purple-500/30",
  };

  return (
    <div
      className={cn(
        "group relative p-6 rounded-2xl",
        "bg-ui-bg-elevated",
        "border border-ui-border-primary",
        "backdrop-blur-md",
        "transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1 shadow-sm",
        borderGlows[gradient],
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "inline-flex p-[2px] rounded-xl mb-5 bg-linear-to-br opacity-80 group-hover:opacity-100 transition-opacity",
          gradients[gradient],
        )}
      >
        <div className="w-12 h-12 rounded-[10px] bg-ui-bg-elevated flex items-center justify-center">
          {icon}
        </div>
      </div>

      {/* Content */}
      <Typography variant="h3" className="text-lg font-semibold mb-2 text-ui-text-primary">
        {title}
      </Typography>
      <Typography variant="p" className="text-ui-text-secondary text-sm leading-relaxed mb-4">
        {description}
      </Typography>

      {/* Link */}
      <a
        href="#"
        className="inline-flex items-center gap-2 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
      >
        Learn more
        <ArrowIcon className="w-4 h-4" />
      </a>
    </div>
  );
}
