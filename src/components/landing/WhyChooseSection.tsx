import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "../ui/progress";
import { Typography } from "../ui/Typography";

export function WhyChooseSection() {
  const stats = [
    { value: 30, label: "Less time in meetings", category: "info" as const },
    { value: 10, label: "Fewer tools to manage", category: "warning" as const },
    { value: 95, label: "Actually use it daily", category: "accent" as const },
    { value: 95, label: "Would recommend", category: "success" as const },
  ];

  return (
    <section className="px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="bg-ui-bg-secondary border border-ui-border-primary rounded-3xl p-12 backdrop-blur-sm">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Teams actually like using it</h2>
            <Typography className="text-ui-text-secondary max-w-2xl mx-auto">
              No training required. No "change management" needed. It just works.
            </Typography>
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
  category,
  delay,
}: {
  value: number;
  label: string;
  category: "info" | "warning" | "accent" | "success";
  delay: number;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  const categoryStyles = {
    info: {
      text: "text-status-info",
      bar: "bg-status-info",
      track: "bg-status-info-bg dark:bg-status-info-bg-dark",
    },
    warning: {
      text: "text-status-warning",
      bar: "bg-status-warning",
      track: "bg-status-warning-bg dark:bg-status-warning-bg-dark",
    },
    accent: {
      text: "text-accent-500 dark:text-accent-400",
      bar: "bg-accent-500 dark:bg-accent-500",
      track: "bg-accent-100 dark:bg-accent-950/30",
    },
    success: {
      text: "text-status-success",
      bar: "bg-status-success",
      track: "bg-status-success-bg dark:bg-status-success-bg-dark",
    },
  };

  return (
    <div className="text-center">
      <div className={cn("text-4xl md:text-5xl font-bold mb-2", categoryStyles[category].text)}>
        {value}%
      </div>
      <Typography variant="small" className="text-ui-text-tertiary mb-4">
        {label}
      </Typography>
      <Progress
        value={progress}
        className={cn("h-1.5", categoryStyles[category].track)}
        indicatorClassName={cn(
          categoryStyles[category].bar,
          "transition-all duration-1000 ease-out",
        )}
      />
    </div>
  );
}
