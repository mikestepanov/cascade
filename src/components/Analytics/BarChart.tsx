import { memo } from "react";
import { Flex } from "../ui/Flex";

/**
 * Horizontal bar chart visualization
 * Extracted from AnalyticsDashboard for better organization and reusability
 */
export const BarChart = memo(function BarChart({
  data,
  color,
}: {
  data: Array<{ label: string; value: number }>;
  color: string;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <Flex direction="column" justify="end" gap="sm" className="h-full">
      {data.map((item) => (
        <Flex key={item.label} gap="sm" align="center">
          <div
            className="w-24 text-sm text-ui-text-primary dark:text-ui-text-primary-dark truncate"
            title={item.label}
          >
            {item.label}
          </div>
          <div className="flex-1 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded-full h-6 relative">
            <div
              className={`${color} h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                minWidth: item.value > 0 ? "2rem" : "0",
              }}
            >
              <span className="text-xs font-semibold text-white">{item.value}</span>
            </div>
          </div>
        </Flex>
      ))}
    </Flex>
  );
});
