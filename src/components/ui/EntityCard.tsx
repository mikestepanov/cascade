import type { ReactNode } from "react";
import { Button } from "./Button";
import { Card, CardBody, CardHeader } from "./Card";

interface EntityCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  actions?: ReactNode;
  badge?: ReactNode;
}

/**
 * Reusable card component for displaying entities in Manager components
 * Provides consistent layout and action buttons
 */
export function EntityCard({
  title,
  description,
  children,
  onEdit,
  onDelete,
  actions,
  badge,
}: EntityCardProps) {
  const defaultActions = (
    <div className="flex gap-2">
      {onEdit && (
        <Button variant="secondary" size="sm" onClick={onEdit}>
          Edit
        </Button>
      )}
      {onDelete && (
        <Button variant="danger" size="sm" onClick={onDelete}>
          Delete
        </Button>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            {title}
            {badge}
          </div>
        }
        description={description}
        action={actions || defaultActions}
      />
      {children && <CardBody>{children}</CardBody>}
    </Card>
  );
}
