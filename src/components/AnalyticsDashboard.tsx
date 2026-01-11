import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useMemo } from "react";
import { BarChart } from "./Analytics/BarChart";
import { ChartCard } from "./Analytics/ChartCard";
import { MetricCard } from "./Analytics/MetricCard";
import { RecentActivity } from "./Analytics/RecentActivity";
import { Skeleton, SkeletonStatCard } from "./ui/Skeleton";
import { Typography } from "./ui/Typography";

interface Props {
  projectId: Id<"projects">;
}

export function AnalyticsDashboard({ projectId }: Props) {
  const analytics = useQuery(api.analytics.getProjectAnalytics, { projectId });
  const velocity = useQuery(api.analytics.getTeamVelocity, { projectId });
  const recentActivity = useQuery(api.analytics.getRecentActivity, {
    projectId,
    limit: 10,
  });

  // Memoize chart data to avoid recalculation on every render
  const statusChartData = useMemo(
    () =>
      analytics
        ? Object.entries(analytics.issuesByStatus).map(([status, count]) => ({
            label: status,
            value: count,
          }))
        : [],
    [analytics],
  );

  const typeChartData = useMemo(
    () =>
      analytics
        ? [
            { label: "Task", value: analytics.issuesByType.task },
            { label: "Bug", value: analytics.issuesByType.bug },
            { label: "Story", value: analytics.issuesByType.story },
            { label: "Epic", value: analytics.issuesByType.epic },
          ]
        : [],
    [analytics],
  );

  const priorityChartData = useMemo(
    () =>
      analytics
        ? [
            { label: "Highest", value: analytics.issuesByPriority.highest },
            { label: "High", value: analytics.issuesByPriority.high },
            { label: "Medium", value: analytics.issuesByPriority.medium },
            { label: "Low", value: analytics.issuesByPriority.low },
            { label: "Lowest", value: analytics.issuesByPriority.lowest },
          ]
        : [],
    [analytics],
  );

  const velocityChartData = useMemo(
    () =>
      velocity
        ? velocity.velocityData.map((v) => ({
            label: v.sprintName,
            value: v.points,
          }))
        : [],
    [velocity],
  );

  const assigneeChartData = useMemo(
    () =>
      analytics
        ? Object.values(analytics.issuesByAssignee).map((a) => ({
            label: a.name,
            value: a.count,
          }))
        : [],
    [analytics],
  );

  if (!(analytics && velocity)) {
    return (
      <div className="p-3 sm:p-6 overflow-y-auto h-full bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header Skeleton */}
          <div>
            <Skeleton className="h-6 sm:h-8 w-48 sm:w-64 mb-2" />
            <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
          </div>

          {/* Metric Cards Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow p-4 sm:p-6">
              <Skeleton className="h-5 sm:h-6 w-36 sm:w-48 mb-4" />
              <Skeleton className="h-48 sm:h-64 w-full" />
            </div>
            <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow p-4 sm:p-6">
              <Skeleton className="h-5 sm:h-6 w-36 sm:w-48 mb-4" />
              <Skeleton className="h-48 sm:h-64 w-full" />
            </div>
            <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow p-4 sm:p-6">
              <Skeleton className="h-5 sm:h-6 w-36 sm:w-48 mb-4" />
              <Skeleton className="h-48 sm:h-64 w-full" />
            </div>
            <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow p-4 sm:p-6">
              <Skeleton className="h-5 sm:h-6 w-36 sm:w-48 mb-4" />
              <Skeleton className="h-48 sm:h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 overflow-y-auto h-full bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <Typography variant="h1" className="text-xl sm:text-2xl font-bold">
            Analytics Dashboard
          </Typography>
          <Typography variant="muted" className="mt-1 sm:text-base">
            Project insights, team velocity, and progress metrics
          </Typography>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard title="Total Issues" value={analytics.totalIssues} icon="📊" />
          <MetricCard
            title="Unassigned"
            value={analytics.unassignedCount}
            icon="📌"
            highlight={analytics.unassignedCount > 0}
          />
          <MetricCard
            title="Avg Velocity"
            value={velocity.averageVelocity}
            subtitle="points/sprint"
            icon="⚡"
          />
          <MetricCard title="Completed Sprints" value={velocity.velocityData.length} icon="✅" />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Issues by Status */}
          <ChartCard title="Issues by Status">
            <BarChart data={statusChartData} color="bg-status-info dark:bg-status-info" />
          </ChartCard>

          {/* Issues by Type */}
          <ChartCard title="Issues by Type">
            <BarChart data={typeChartData} color="bg-status-success dark:bg-status-success" />
          </ChartCard>

          {/* Issues by Priority */}
          <ChartCard title="Issues by Priority">
            <BarChart data={priorityChartData} color="bg-status-warning dark:bg-status-warning" />
          </ChartCard>

          {/* Team Velocity */}
          <ChartCard title="Team Velocity (Last 10 Sprints)">
            {velocityChartData.length > 0 ? (
              <BarChart data={velocityChartData} color="bg-accent-600 dark:bg-accent-500" />
            ) : (
              <div className="flex items-center justify-center h-full text-ui-text-secondary dark:text-ui-text-secondary-dark">
                <Typography variant="p">No completed sprints yet</Typography>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Issues by Assignee */}
        {assigneeChartData.length > 0 && (
          <ChartCard title="Issues by Assignee">
            <BarChart data={assigneeChartData} color="bg-brand-600 dark:bg-brand-500" />
          </ChartCard>
        )}

        {/* Recent Activity */}
        <RecentActivity activities={recentActivity} />
      </div>
    </div>
  );
}
