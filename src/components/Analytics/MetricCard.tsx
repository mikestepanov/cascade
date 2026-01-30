import { memo } from "react";
import { cn } from "@/lib/utils";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

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
      className={cn("bg-ui-bg rounded-lg shadow p-6", highlight && "ring-2 ring-status-warning")}
    >
      <Flex justify="between" align="center">
        <div>
          <Typography className="text-sm font-medium" color="secondary">
            {title}
          </Typography>
          <Typography className="text-3xl font-bold mt-2">{value}</Typography>
          {subtitle && (
            <Typography variant="muted" className="text-xs mt-1">
              {subtitle}
            </Typography>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </Flex>
    </div>
  );
});
