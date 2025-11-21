import type { ReactNode } from "react";
import { handleKeyboardClick } from "@/lib/accessibility";

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = "", hoverable = false, onClick }: CardProps) {
  const interactiveProps = onClick
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick,
        onKeyDown: handleKeyboardClick(onClick),
      }
    : {};

  return (
    <div
      className={`bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg border border-ui-border-primary dark:border-ui-border-primary-dark ${
        hoverable ? "hover:shadow-md transition-shadow cursor-pointer" : ""
      } ${className}`}
      {...interactiveProps}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="p-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1">
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = "" }: CardBodyProps) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
