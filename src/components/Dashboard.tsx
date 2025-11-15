import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";

type IssueFilter = "assigned" | "created" | "all";

interface DashboardProps {
  onNavigateToProject?: (projectId: Id<"projects">) => void;
}

export function Dashboard({ onNavigateToProject }: DashboardProps) {
  const [issueFilter, setIssueFilter] = useState<IssueFilter>("assigned");

  const myIssues = useQuery(api.dashboard.getMyIssues);
  const myCreatedIssues = useQuery(api.dashboard.getMyCreatedIssues);
  const myProjects = useQuery(api.dashboard.getMyProjects);
  const recentActivity = useQuery(api.dashboard.getMyRecentActivity, { limit: 10 });
  const stats = useQuery(api.dashboard.getMyStats);

  const displayIssues =
    issueFilter === "assigned"
      ? myIssues
      : issueFilter === "created"
        ? myCreatedIssues
        : [...(myIssues || []), ...(myCreatedIssues || [])];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "highest":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-blue-600 bg-blue-100";
      case "lowest":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return "🐛";
      case "story":
        return "📖";
      case "epic":
        return "🎯";
      default:
        return "📋";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return "➕";
      case "updated":
        return "✏️";
      case "commented":
        return "💬";
      case "assigned":
        return "👤";
      case "moved":
        return "🔄";
      default:
        return "📝";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Work</h1>
          <p className="text-gray-600 mt-1">Your personal dashboard and activity center</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardBody className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats?.assignedToMe || 0}</div>
              <div className="text-sm text-gray-600 mt-1">Assigned to Me</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats?.completedThisWeek || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Completed This Week</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats?.highPriority || 0}</div>
              <div className="text-sm text-gray-600 mt-1">High Priority</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats?.createdByMe || 0}</div>
              <div className="text-sm text-gray-600 mt-1">Created by Me</div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Issues */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="My Issues" description="Track your assigned and created issues" />
              <div className="border-b border-gray-200 px-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => setIssueFilter("assigned")}
                    className={`pb-2 px-2 border-b-2 transition-colors ${
                      issueFilter === "assigned"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Assigned ({myIssues?.length || 0})
                  </button>
                  <button
                    onClick={() => setIssueFilter("created")}
                    className={`pb-2 px-2 border-b-2 transition-colors ${
                      issueFilter === "created"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Created ({myCreatedIssues?.length || 0})
                  </button>
                </div>
              </div>
              <CardBody>
                {!displayIssues || displayIssues.length === 0 ? (
                  <EmptyState
                    icon="📭"
                    title="No issues found"
                    description={
                      issueFilter === "assigned"
                        ? "You don't have any assigned issues"
                        : "You haven't created any issues yet"
                    }
                  />
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {displayIssues.map((issue) => (
                      <div
                        key={issue._id}
                        onClick={() => onNavigateToProject?.(issue.projectId)}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-mono text-gray-500">{issue.key}</span>
                              <span className="text-lg">{getTypeIcon(issue.type)}</span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(issue.priority)}`}
                              >
                                {issue.priority}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">{issue.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{issue.projectName}</span>
                              <span>•</span>
                              <span>{issue.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* My Projects */}
            <Card>
              <CardHeader title="My Projects" description={`${myProjects?.length || 0} projects`} />
              <CardBody>
                {!myProjects || myProjects.length === 0 ? (
                  <EmptyState
                    icon="📂"
                    title="No projects"
                    description="You're not a member of any projects yet"
                  />
                ) : (
                  <div className="space-y-2">
                    {myProjects.map((project) => (
                      <div
                        key={project._id}
                        onClick={() => onNavigateToProject?.(project._id)}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900">{project.name}</h4>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded capitalize">
                            {project.role}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {project.myIssues} my issues • {project.totalIssues} total
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader title="Recent Activity" description="Latest updates" />
              <CardBody>
                {!recentActivity || recentActivity.length === 0 ? (
                  <EmptyState
                    icon="📊"
                    title="No activity"
                    description="No recent activity to show"
                  />
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {recentActivity.map((activity) => (
                      <div key={activity._id} className="text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{getActionIcon(activity.action)}</span>
                          <div className="flex-1">
                            <div className="text-gray-900">
                              <span className="font-medium">{activity.userName}</span>{" "}
                              <span className="text-gray-600">{activity.action}</span>{" "}
                              <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                                {activity.issueKey}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {activity.projectName} •{" "}
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
