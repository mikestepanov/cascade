import { Card, CardBody } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
/**
 * Wrapper card for chart visualizations
 * Extracted from AnalyticsDashboard for better organization
 */
export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardBody className="p-6">
        <Typography variant="h3" className="text-lg font-semibold text-ui-text mb-4">
          {title}
        </Typography>
        <div className="h-64">{children}</div>
      </CardBody>
    </Card>
  );
}
