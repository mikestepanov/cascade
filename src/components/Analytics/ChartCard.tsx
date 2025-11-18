/**
 * Wrapper card for chart visualizations
 * Extracted from AnalyticsDashboard for better organization
 */
export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-64">{children}</div>
    </div>
  );
}
