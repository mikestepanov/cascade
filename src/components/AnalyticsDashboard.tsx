import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

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

  if (!analytics || !velocity) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Project insights, team velocity, and progress metrics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Issues"
            value={analytics.totalIssues}
            icon="📊"
          />
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
          <MetricCard
            title="Completed Sprints"
            value={velocity.velocityData.length}
            icon="✅"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Issues by Status */}
          <ChartCard title="Issues by Status">
            <BarChart
              data={Object.entries(analytics.issuesByStatus).map(
                ([status, count]) => ({
                  label: status,
                  value: count,
                })
              )}
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
        {recentActivity && recentActivity.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity._id}
                  className="flex items-start gap-3 text-sm border-b border-gray-100 pb-3 last:border-0"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                    {activity.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900">
                      <span className="font-medium">{activity.userName}</span>{" "}
                      {activity.action}{" "}
                      {activity.field && (
                        <>
                          <span className="font-medium">{activity.field}</span>{" "}
                          on
                        </>
                      )}{" "}
                      <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                        {activity.issueKey}
                      </span>
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
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
    <div
      className={`bg-white rounded-lg shadow p-6 ${
        highlight ? "ring-2 ring-orange-500" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-64">{children}</div>
    </div>
  );
}

function BarChart({
  data,
  color,
}: {
  data: Array<{ label: string; value: number }>;
  color: string;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="h-full flex flex-col justify-end space-y-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
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
              <span className="text-xs font-semibold text-white">
                {item.value}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
