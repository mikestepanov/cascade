import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useListNavigation } from "../hooks/useListNavigation";
import { MyIssuesList } from "./Dashboard/MyIssuesList";
import { QuickStats } from "./Dashboard/QuickStats";
import { RecentActivity } from "./Dashboard/RecentActivity";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { SkeletonProjectCard } from "./ui/Skeleton";

type IssueFilter = "assigned" | "created" | "all";

interface DashboardProps {
  onNavigateToProject?: (projectId: Id<"projects">) => void;
  onNavigateToProjects?: () => void;
}

export function Dashboard({ onNavigateToProject, onNavigateToProjects }: DashboardProps) {
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

  // Keyboard navigation for issue list
  const issueNavigation = useListNavigation({
    items: displayIssues || [],
    onSelect: (issue) => onNavigateToProject?.(issue.projectId),
    enabled: !!displayIssues && displayIssues.length > 0,
  });

  // Keyboard navigation for projects list
  const projectNavigation = useListNavigation({
    items: myProjects || [],
    onSelect: (project) => onNavigateToProject?.(project._id),
    enabled: !!myProjects && myProjects.length > 0,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            My Work
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Your personal dashboard and activity center
          </p>
        </div>

        {/* Stats Cards */}
        <QuickStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Issues */}
          <div className="lg:col-span-2">
            <MyIssuesList
              myIssues={myIssues}
              myCreatedIssues={myCreatedIssues}
              displayIssues={displayIssues}
              issueFilter={issueFilter}
              onFilterChange={setIssueFilter}
              issueNavigation={issueNavigation}
              onNavigateToProject={onNavigateToProject}
              onNavigateToProjects={onNavigateToProjects}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* My Projects */}
            <Card>
              <CardHeader title="My Projects" description={`${myProjects?.length || 0} projects`} />
              <CardBody>
                {!myProjects ? (
                  /* Loading skeleton */
                  <div className="space-y-2">
                    <SkeletonProjectCard />
                    <SkeletonProjectCard />
                    <SkeletonProjectCard />
                  </div>
                ) : myProjects.length === 0 ? (
                  <EmptyState
                    icon="📂"
                    title="No projects"
                    description="You're not a member of any projects yet"
                    action={
                      onNavigateToProjects
                        ? {
                            label: "Go to Projects",
                            onClick: onNavigateToProjects,
                          }
                        : undefined
                    }
                  />
                ) : (
                  <div ref={projectNavigation.listRef} className="space-y-2">
                    {myProjects.map((project, index) => (
                      <div
                        key={project._id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onNavigateToProject?.(project._id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onNavigateToProject?.(project._id);
                          }
                        }}
                        {...projectNavigation.getItemProps(index)}
                        className={`p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all hover:shadow-md animate-slide-up ${projectNavigation.getItemProps(index).className}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {project.name}
                          </h4>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded capitalize flex-shrink-0">
                            {project.role}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {project.myIssues} my issues • {project.totalIssues} total
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Recent Activity */}
            <RecentActivity activities={recentActivity} />
          </div>
        </div>
      </div>
    </div>
  );
}
