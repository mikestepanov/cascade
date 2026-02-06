import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?:
    | ReactNode
    | {
        label: string;
        onClick: () => void;
      };
  /** Optional className for the container */
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const renderAction = () => {
    if (!action) return null;

    // Check if action is a button configuration object
    if (typeof action === "object" && action !== null && "label" in action && "onClick" in action) {
      const act = action as { label: string; onClick: () => void };
      if (typeof act.label === "string" && typeof act.onClick === "function") {
        return <Button onClick={act.onClick}>{act.label}</Button>;
      }
    }
    return action as ReactNode;
  };

  return (
    <div className={cn("text-center py-12 px-4 animate-fade-in", className)}>
      <div className="text-6xl mb-4 text-ui-text-tertiary">{icon}</div>
      <h3 className="text-lg font-medium text-ui-text tracking-tight mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-ui-text-secondary mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{renderAction()}</div>}
    </div>
  );
}
