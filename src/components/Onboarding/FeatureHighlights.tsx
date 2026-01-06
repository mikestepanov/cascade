import { FileText, Kanban, Zap } from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="text-center p-4">
      <div className="inline-flex p-3 rounded-lg bg-ui-bg-primary dark:bg-ui-bg-secondary-dark mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
        {title}
      </h3>
      <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
        {description}
      </p>
    </div>
  );
}

export function FeatureHighlights() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <FeatureCard
        icon={<Kanban className="w-6 h-6 text-brand-500 dark:text-brand-400" />}
        title="Kanban Boards"
        description="Visualize work with drag-and-drop boards"
      />
      <FeatureCard
        icon={
          <FileText className="w-6 h-6 text-status-success dark:text-status-success-text-dark" />
        }
        title="Documents"
        description="Collaborate on docs in real-time"
      />
      <FeatureCard
        icon={<Zap className="w-6 h-6 text-status-warning dark:text-status-warning-text-dark" />}
        title="Sprint Planning"
        description="Plan and track team velocity"
      />
    </div>
  );
}
