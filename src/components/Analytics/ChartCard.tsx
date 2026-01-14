/**
 * Wrapper card for chart visualizations
 * Extracted from AnalyticsDashboard for better organization
 */
export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-ui-bg-primary rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-ui-text-primary mb-4">{title}</h3>
      <div className="h-64">{children}</div>
    </div>
  );
}
