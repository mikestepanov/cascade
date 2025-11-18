/**
 * Horizontal bar chart visualization
 * Extracted from AnalyticsDashboard for better organization and reusability
 */
export function BarChart({
  data,
  color,
}: {
  data: Array<{ label: string; value: number }>;
  color: string;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="h-full flex flex-col justify-end space-y-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div className="w-24 text-sm text-gray-700 truncate" title={item.label}>
            {item.label}
          </div>
          <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
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
        </div>
      ))}
    </div>
  );
}
