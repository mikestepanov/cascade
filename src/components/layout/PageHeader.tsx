import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps): ReactNode {
  return (
    <div className={cn("mb-6", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2">
          <Flex as="ol" gap="xs" align="center" className="list-none p-0 m-0">
            {breadcrumbs.map((crumb, i) => (
              <Flex as="li" key={crumb.label} gap="xs" align="center">
                {i > 0 && <span className="text-ui-text-tertiary">/</span>}
                {crumb.to ? (
                  <Link
                    to={crumb.to}
                    className="text-sm text-ui-text-secondary hover:text-ui-text-primary transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-sm text-ui-text-tertiary">{crumb.label}</span>
                )}
              </Flex>
            ))}
          </Flex>
        </nav>
      )}
      <Flex justify="between" align="start" gap="md">
        <div>
          <Typography variant="h3" className="text-xl font-semibold">
            {title}
          </Typography>
          {description && (
            <Typography variant="muted" className="mt-1">
              {description}
            </Typography>
          )}
        </div>
        {actions && (
          <Flex gap="sm" align="center" className="shrink-0">
            {actions}
          </Flex>
        )}
      </Flex>
    </div>
  );
}
