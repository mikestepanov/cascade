import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { BarChart } from "./Analytics/BarChart";
import { ChartCard } from "./Analytics/ChartCard";
import { MetricCard } from "./Analytics/MetricCard";
import { RecentActivity } from "./Analytics/RecentActivity";
import { Skeleton, SkeletonStatCard } from "./ui/Skeleton";

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

  if (!(analytics && velocity)) {
    return (
      <div className="p-3 sm:p-6 overflow-y-auto h-full bg-gray-50 dark:bg-gray-900">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
              <Skeleton className="h-5 sm:h-6 w-36 sm:w-48 mb-4" />
              <Skeleton className="h-48 sm:h-64 w-full" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
              <Skeleton className="h-5 sm:h-6 w-36 sm:w-48 mb-4" />
              <Skeleton className="h-48 sm:h-64 w-full" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
              <Skeleton className="h-5 sm:h-6 w-36 sm:w-48 mb-4" />
              <Skeleton className="h-48 sm:h-64 w-full" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
              <Skeleton className="h-5 sm:h-6 w-36 sm:w-48 mb-4" />
              <Skeleton className="h-48 sm:h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 overflow-y-auto h-full bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Analytics Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Project insights, team velocity, and progress metrics
          </p>
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
            <BarChart
              data={Object.entries(analytics.issuesByStatus).map(([status, count]) => ({
                label: status,
                value: count,
              }))}
              color="bg-blue-500"
            />
          </ChartCard>

          {/* Issues by Type */}
          <ChartCard title="Issues by Type">
            <BarChart
              data={[
                { label: "Task", value: analytics.issuesByType.task },
                { label: "Bug", value: analytics.issuesByType.bug },
                { label: "Story", value: analytics.issuesByType.story },
                { label: "Epic", value: analytics.issuesByType.epic },
              ]}
              color="bg-green-500"
            />
          </ChartCard>

          {/* Issues by Priority */}
          <ChartCard title="Issues by Priority">
            <BarChart
              data={[
                {
                  label: "Highest",
                  value: analytics.issuesByPriority.highest,
                },
                { label: "High", value: analytics.issuesByPriority.high },
                { label: "Medium", value: analytics.issuesByPriority.medium },
                { label: "Low", value: analytics.issuesByPriority.low },
                { label: "Lowest", value: analytics.issuesByPriority.lowest },
              ]}
              color="bg-red-500"
            />
          </ChartCard>

          {/* Team Velocity */}
          <ChartCard title="Team Velocity (Last 10 Sprints)">
            {velocity.velocityData.length > 0 ? (
              <BarChart
                data={velocity.velocityData.map((v) => ({
                  label: v.sprintName,
                  value: v.points,
                }))}
                color="bg-purple-500"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No completed sprints yet</p>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Issues by Assignee */}
        {Object.keys(analytics.issuesByAssignee).length > 0 && (
          <ChartCard title="Issues by Assignee">
            <BarChart
              data={Object.values(analytics.issuesByAssignee).map((a) => ({
                label: a.name,
                value: a.count,
              }))}
              color="bg-indigo-500"
            />
          </ChartCard>
        )}

        {/* Recent Activity */}
        <RecentActivity activities={recentActivity} />
      </div>
    </div>
  );
}
