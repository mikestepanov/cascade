import type { ReactNode } from "react";
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
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
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
    <div className="text-center py-12 px-4">
      <div className="text-6xl mb-3 animate-in fade-in duration-500">{icon}</div>
      <h3 className="text-lg font-medium text-ui-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-ui-text-tertiary mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {renderAction()}
    </div>
  );
}
