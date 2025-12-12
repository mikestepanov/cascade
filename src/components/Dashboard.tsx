import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { useCompanyOptional } from "@/routes/_auth/_app/$companySlug/route";
import { api } from "../../convex/_generated/api";
import { useListNavigation } from "../hooks/useListNavigation";
import { MyIssuesList } from "./Dashboard/MyIssuesList";
import { ProjectsList } from "./Dashboard/ProjectsList";
import { QuickStats } from "./Dashboard/QuickStats";
import { RecentActivity } from "./Dashboard/RecentActivity";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Typography } from "./ui/Typography";

type IssueFilter = "assigned" | "created" | "all";

export function Dashboard() {
  const navigate = useNavigate();
  const company = useCompanyOptional();
  const [issueFilter, setIssueFilter] = useState<IssueFilter>("assigned");

  // All hooks must be called unconditionally
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

  // Navigation helpers
  const navigateToProject = (projectKey: string) => {
    navigate({ to: ROUTES.projects.board(companySlug, projectKey) });
  };

  const navigateToProjects = () => {
    navigate({ to: ROUTES.projects.list(companySlug) });
  };

  // Keyboard navigation for issue list
  const issueNavigation = useListNavigation({
    items: displayIssues || [],
    onSelect: (issue) => navigateToProject(issue.projectKey),
    enabled: !!displayIssues && displayIssues.length > 0,
  });

  // Keyboard navigation for projects list
  const projectNavigation = useListNavigation({
    items: myProjects || [],
    onSelect: (project) => navigateToProject(project.key),
    enabled: !!myProjects && myProjects.length > 0,
  });

  // Show loading while company context loads
  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { companySlug } = company;

  return (
    <div className="min-h-screen bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <Typography variant="h1" className="text-2xl sm:text-3xl font-bold">
            My Work
          </Typography>
          <Typography variant="muted" className="mt-1 sm:text-base">
            Your personal dashboard and activity center
          </Typography>
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
              onNavigateToProject={navigateToProject}
              onNavigateToProjects={navigateToProjects}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* My Projects */}
            <ProjectsList
              projects={myProjects}
              projectNavigation={projectNavigation}
              onNavigateToProject={navigateToProject}
              onNavigateToProjects={navigateToProjects}
            />

            {/* Recent Activity */}
            <RecentActivity activities={recentActivity} />
          </div>
        </div>
      </div>
    </div>
  );
}
