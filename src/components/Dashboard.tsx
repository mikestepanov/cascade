import { api } from "@convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import { usePaginatedQuery, useQuery } from "convex/react";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { useCompany } from "@/hooks/useCompanyContext";
import { useListNavigation } from "../hooks/useListNavigation";
import { DashboardCustomizeModal } from "./Dashboard/DashboardCustomizeModal";
import { MyIssuesList } from "./Dashboard/MyIssuesList";
import { WorkspacesList } from "./Dashboard/ProjectsList";
import { QuickStats } from "./Dashboard/QuickStats";
import { RecentActivity } from "./Dashboard/RecentActivity";
import { Typography } from "./ui/Typography";

type IssueFilter = "assigned" | "created" | "all";

export function Dashboard() {
  const navigate = useNavigate();
  const { companySlug } = useCompany();
  const [issueFilter, setIssueFilter] = useState<IssueFilter>("assigned");

  // User Settings
  const userSettings = useQuery(api.userSettings.get);
  const layout = userSettings?.dashboardLayout;
  const showStats = layout?.showStats ?? true;
  const showRecentActivity = layout?.showRecentActivity ?? true;
  const showWorkspaces = layout?.showWorkspaces ?? true;
  const sidebarVisible = showRecentActivity || showWorkspaces;

  // Data fetching
  const {
    results: myIssues,
    status: myIssuesStatus,
    loadMore: loadMoreMyIssues,
  } = usePaginatedQuery(api.dashboard.getMyIssues, {}, { initialNumItems: 20 });

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

  // Navigation helper for keyboard navigation callbacks
  const navigateToWorkspace = (projectKey: string) => {
    navigate({ to: ROUTES.projects.board(companySlug, projectKey) });
  };

  // Keyboard navigation for issue list
  const issueNavigation = useListNavigation({
    items: displayIssues || [],
    onSelect: (issue) => navigateToWorkspace(issue.projectKey),
    enabled: !!displayIssues && displayIssues.length > 0,
  });

  // Keyboard navigation for projects list
  const projectNavigation = useListNavigation({
    items: myProjects || [],
    onSelect: (project) => navigateToWorkspace(project.key),
    enabled: !!myProjects && myProjects.length > 0,
  });

  return (
    <div className="min-h-screen bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Typography variant="h1" className="text-2xl sm:text-3xl font-bold">
              My Work
            </Typography>
            <Typography variant="muted" className="mt-1 sm:text-base">
              Your personal dashboard and activity center
            </Typography>
          </div>
          <DashboardCustomizeModal />
        </div>

        {/* Stats Cards */}
        {showStats && <QuickStats stats={stats} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Issues */}
          <div className={sidebarVisible ? "lg:col-span-2" : "lg:col-span-3"}>
            <MyIssuesList
              myIssues={myIssues}
              myCreatedIssues={myCreatedIssues}
              displayIssues={displayIssues}
              issueFilter={issueFilter}
              onFilterChange={setIssueFilter}
              issueNavigation={issueNavigation}
              loadMore={loadMoreMyIssues}
              status={myIssuesStatus}
            />
          </div>

          {/* Sidebar */}
          {sidebarVisible && (
            <div className="space-y-6">
              {/* My Workspaces */}
              {showWorkspaces && (
                <WorkspacesList projects={myProjects} projectNavigation={projectNavigation} />
              )}

              {/* Recent Activity */}
              {showRecentActivity && <RecentActivity activities={recentActivity} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
