import { useEffect, useState } from "react";

export function WhyChooseSection() {
  const stats = [
    { value: 30, label: "Less time in meetings", color: "cyan" as const },
    { value: 10, label: "Fewer tools to manage", color: "teal" as const },
    { value: 95, label: "Actually use it daily", color: "purple" as const },
    { value: 95, label: "Would recommend", color: "emerald" as const },
  ];

  return (
    <section className="px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-b from-gray-800/30 to-gray-900/30 border border-gray-700/30 rounded-3xl p-12 backdrop-blur-sm">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Teams actually like using it</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              No training required. No "change management" needed. It just works.
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
