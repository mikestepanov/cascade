import { Card, CardBody } from "../ui/Card";
import { SkeletonStatCard } from "../ui/Skeleton";

interface Stats {
  assignedToMe: number;
  completedThisWeek: number;
  highPriority: number;
  createdByMe: number;
}

interface QuickStatsProps {
  stats: Stats | undefined;
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  textColor: string;
}

/**
 * Individual stat card component
 */
function StatCard({
  title,
  value,
  subtitle,
  gradientFrom,
  gradientTo,
  borderColor,
  textColor,
}: StatCardProps) {
  return (
    <Card
      className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} border-l-4 ${borderColor} animate-fade-in`}
    >
      <CardBody className="text-center">
        <div className={`text-sm font-medium ${textColor} mb-2`}>{title}</div>
        <div className={`text-4xl font-bold ${textColor}`}>{value || 0}</div>
        <div className={`text-xs ${textColor} mt-2`}>{subtitle}</div>
      </CardBody>
    </Card>
  );
}

/**
 * High priority stat card with conditional styling
 */
function HighPriorityCard({ count }: { count: number }) {
  const hasHighPriority = count > 0;
  return (
    <Card
      className={`border-l-4 animate-fade-in ${
        hasHighPriority
          ? "bg-gradient-to-br from-status-warning-bg to-ui-bg-primary dark:from-status-warning-bg-dark dark:to-ui-bg-primary-dark border-status-warning dark:border-status-warning"
          : "bg-gradient-to-br from-ui-bg-secondary to-ui-bg-primary dark:from-ui-bg-secondary-dark dark:to-ui-bg-primary-dark border-ui-border-primary dark:border-ui-border-primary-dark"
      }`}
    >
      <CardBody className="text-center">
        <div
          className={`text-sm font-medium mb-2 ${
            hasHighPriority
              ? "text-status-warning-text dark:text-status-warning-text-dark"
              : "text-ui-text-secondary dark:text-ui-text-secondary-dark"
          }`}
        >
          HIGH PRIORITY
        </div>
        <div
          className={`text-4xl font-bold ${
            hasHighPriority
              ? "text-status-warning dark:text-status-warning"
              : "text-ui-text-tertiary dark:text-ui-text-tertiary-dark"
          }`}
        >
          {count || 0}
        </div>
        <div
          className={`text-xs mt-2 ${
            hasHighPriority
              ? "text-status-warning dark:text-status-warning"
              : "text-ui-text-secondary dark:text-ui-text-secondary-dark"
          }`}
        >
          {hasHighPriority ? "Needs attention" : "All clear"}
        </div>
      </CardBody>
    </Card>
  );
}

/**
 * Dashboard quick stats cards showing:
 * - Assigned issues
 * - Completed this week
 * - High priority issues
 * - Created issues
 */
export function QuickStats({ stats }: QuickStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="ASSIGNED TO ME"
        value={stats.assignedToMe}
        subtitle="Active tasks"
        gradientFrom="from-brand-50"
        gradientTo="to-ui-bg-primary dark:from-brand-900/20 dark:to-ui-bg-primary-dark"
        borderColor="border-brand-600 dark:border-brand-500"
        textColor="text-brand-700 dark:text-brand-400"
      />
      <StatCard
        title="COMPLETED"
        value={stats.completedThisWeek}
        subtitle="This week"
        gradientFrom="from-status-success-bg"
        gradientTo="to-ui-bg-primary dark:from-status-success-bg-dark dark:to-ui-bg-primary-dark"
        borderColor="border-status-success dark:border-status-success"
        textColor="text-status-success-text dark:text-status-success-text-dark"
      />
      <HighPriorityCard count={stats.highPriority} />
      <StatCard
        title="CREATED"
        value={stats.createdByMe}
        subtitle="Total issues"
        gradientFrom="from-accent-50"
        gradientTo="to-ui-bg-primary dark:from-accent-900/20 dark:to-ui-bg-primary-dark"
        borderColor="border-accent-600 dark:border-accent-500"
        textColor="text-accent-700 dark:text-accent-400"
      />
    </div>
  );
}
