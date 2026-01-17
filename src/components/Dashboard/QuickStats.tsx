import { cn } from "@/lib/utils";
import { Card, CardBody } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Progress } from "../ui/progress";
import { SkeletonStatCard } from "../ui/Skeleton";
import { Typography } from "../ui/Typography";

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
  colorClass: string;
  progressValue?: number;
}

/**
 * Individual stat card component with glassmorphism
 */
function StatCard({ title, value, subtitle, colorClass, progressValue }: StatCardProps) {
  return (
    <Card
      className={cn(
        "bg-ui-bg-primary/40 backdrop-blur-md border-ui-border-primary/50 group hover:bg-ui-bg-primary/60 transition-all duration-300 shadow-sm hover:shadow-lg animate-in fade-in zoom-in",
      )}
    >
      <CardBody className="p-5">
        <Typography
          variant="small"
          color="tertiary"
          className="text-[10px] uppercase tracking-wider mb-2 font-bold"
        >
          {title}
        </Typography>
        <Flex align="baseline" gap="xs" className="mb-3">
          <Typography variant="h2" className={cn("text-3xl font-extrabold", colorClass)}>
            {value || 0}
          </Typography>
          <Typography variant="small" color="secondary" className="text-xs">
            {subtitle}
          </Typography>
        </Flex>
        {progressValue !== undefined && (
          <div className="mt-4">
            <Progress
              value={progressValue}
              className="h-1.5"
              indicatorClassName={colorClass.replace("text-", "bg-")}
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

/**
 * High priority stat card with high-impact styling
 */
function HighPriorityCard({ count }: { count: number }) {
  const hasHighPriority = count > 0;
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-500 shadow-sm hover:shadow-xl animate-in fade-in zoom-in",
        hasHighPriority
          ? "bg-linear-to-br from-status-warning-bg/40 to-status-warning-bg/10 backdrop-blur-md border-status-warning/30"
          : "bg-ui-bg-primary/40 backdrop-blur-md border-ui-border-primary/50",
      )}
    >
      <CardBody className="p-5 relative z-10">
        <Typography
          variant="small"
          className={cn(
            "text-[10px] uppercase tracking-wider mb-2 font-bold",
            hasHighPriority ? "text-status-warning" : "text-ui-text-tertiary",
          )}
        >
          Attention Needed
        </Typography>
        <Flex align="baseline" gap="xs">
          <Typography
            variant="h2"
            className={cn(
              "text-3xl font-extrabold",
              hasHighPriority ? "text-status-warning" : "text-ui-text-primary",
            )}
          >
            {count || 0}
          </Typography>
          <Typography variant="small" color="secondary" className="text-xs">
            High Priority
          </Typography>
        </Flex>

        {hasHighPriority && (
          <div className="absolute right-0 top-0 h-full w-1.5 bg-status-warning" />
        )}
      </CardBody>

      {hasHighPriority && (
        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-status-warning/10 rounded-full blur-xl" />
      )}
    </Card>
  );
}

/**
 * Dashboard quick stats cards showing high-density metrics
 */
export function QuickStats({ stats }: QuickStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
    );
  }

  // Calculate completion percentage for the progress bar
  const totalAssigned = stats.assignedToMe + stats.completedThisWeek;
  const completionPercentage =
    totalAssigned > 0 ? (stats.completedThisWeek / totalAssigned) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="Active Load"
        value={stats.assignedToMe}
        subtitle="Assigned tasks"
        colorClass="text-brand-600 dark:text-brand-400"
      />
      <StatCard
        title="Velocity"
        value={stats.completedThisWeek}
        subtitle="Done this week"
        colorClass="text-status-success"
        progressValue={completionPercentage}
      />
      <HighPriorityCard count={stats.highPriority} />
      <StatCard
        title="Contribution"
        value={stats.createdByMe}
        subtitle="Reported issues"
        colorClass="text-accent-600 dark:text-accent-400"
      />
    </div>
  );
}
