import { FileText, Kanban, Zap } from "lucide-react";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "../ui/Typography";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="text-center p-4">
      <Flex inline className="p-3 rounded-lg bg-ui-bg-primary mb-3">
        {icon}
      </Flex>
      <Typography variant="h3" className="font-semibold text-ui-text-primary mb-1">
        {title}
      </Typography>
      <Typography className="text-sm text-ui-text-secondary">{description}</Typography>
    </div>
  );
}

export function FeatureHighlights() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <FeatureCard
        icon={<Kanban className="w-6 h-6 text-brand-indigo-text" />}
        title="Kanban Boards"
        description="Visualize work with drag-and-drop boards"
      />
      <FeatureCard
        icon={<FileText className="w-6 h-6 text-status-success" />}
        title="Documents"
        description="Collaborate on docs in real-time"
      />
      <FeatureCard
        icon={<Zap className="w-6 h-6 text-status-warning" />}
        title="Sprint Planning"
        description="Plan and track team velocity"
      />
    </div>
  );
}
