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
    <div className="min-h-screen bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
            My Work
          </h1>
          <p className="text-sm sm:text-base text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1">
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
                      <button
                        key={project._id}
                        type="button"
                        onClick={() => onNavigateToProject?.(project._id)}
                        {...projectNavigation.getItemProps(index)}
                        className={`w-full text-left p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark cursor-pointer transition-all hover:shadow-md animate-slide-up ${projectNavigation.getItemProps(index).className}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark truncate">
                            {project.name}
                          </h4>
                          <span className="text-xs px-2 py-0.5 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 rounded capitalize flex-shrink-0">
                            {project.role}
                          </span>
                        </div>
                        <div className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                          {project.myIssues} my issues • {project.totalIssues} total
                        </div>
                      </button>
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
