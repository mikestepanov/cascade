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
  children?: ReactNode;
}

export function EmptyState({ icon, title, description, action, children }: EmptyStateProps) {
  const renderAction = () => {
    if (!action) return null;
    if (
      typeof action === "object" &&
      action !== null &&
      "label" in action &&
      typeof (action as any).label === "string" &&
      "onClick" in action &&
      typeof (action as any).onClick === "function"
    ) {
      return (
        <Button onClick={(action as any).onClick}>{(action as any).label}</Button>
      );
    }
    return action as ReactNode;
  };

  return (
    <div className="text-center py-12 px-4">
      <div className="text-6xl mb-3 animate-in fade-in duration-500">{icon}</div>
      <h3 className="text-lg font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark mb-4 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {renderAction()}
      {children}
    </div>
  );
}
