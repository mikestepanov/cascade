/**
 * Metric display card for analytics dashboard
 * Extracted from AnalyticsDashboard for better organization
 */
export function MetricCard({
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
    <div className={`bg-white rounded-lg shadow p-6 ${highlight ? "ring-2 ring-orange-500" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}
