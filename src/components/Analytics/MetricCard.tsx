import { memo } from "react";

/**
 * Metric display card for analytics dashboard
 * Extracted from AnalyticsDashboard for better organization
 */
export const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  icon,
  highlight,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow p-6 ${highlight ? "ring-2 ring-status-warning" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-ui-text-secondary dark:text-ui-text-secondary-dark">{title}</p>
          <p className="text-3xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mt-2">{value}</p>
          {subtitle && <p className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1">{subtitle}</p>}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
});
