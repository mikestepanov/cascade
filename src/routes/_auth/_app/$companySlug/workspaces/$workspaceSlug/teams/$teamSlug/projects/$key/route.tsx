import { api } from "@convex/_generated/api";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ROUTES } from "@/config/routes";
import { useCompany } from "@/contexts/CompanyContext";

export const Route = createFileRoute(
  "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key",
)({
  component: ProjectLayout,
});

function ProjectLayout() {
  const { key, workspaceSlug, teamSlug } = Route.useParams();
  const { company } = useCompany();
  const companySlug = company?.slug ?? "";
  const project = useQuery(api.projects.getByKey, { key });

  if (project === undefined) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <LoadingSpinner message="Loading project..." />
      </Flex>
    );
  }

  if (!project) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
          <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
            The project "{key}" doesn't exist or you don't have access to it.
          </p>
        </div>
      </Flex>
    );
  }

  const tabs = [
    {
      name: "Board",
      href: ROUTES.workspaces.teams.projects.board(companySlug, workspaceSlug, teamSlug, key),
    },
    {
      name: "Calendar",
      href: ROUTES.workspaces.teams.projects.calendar(companySlug, workspaceSlug, teamSlug, key),
    },
    {
      name: "Timesheet",
      href: ROUTES.workspaces.teams.projects.timesheet(companySlug, workspaceSlug, teamSlug, key),
    },
    {
      name: "Settings",
      href: ROUTES.workspaces.teams.projects.settings(companySlug, workspaceSlug, teamSlug, key),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb */}
      <div className="px-4 py-2 border-b border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark text-sm">
        <Link to={ROUTES.workspaces.list(companySlug)} className="text-blue-600 hover:underline">
          Workspaces
        </Link>
        <span className="mx-2 text-ui-text-tertiary">/</span>
        <Link
          to={ROUTES.workspaces.detail(companySlug, workspaceSlug)}
          className="text-blue-600 hover:underline"
        >
          {workspaceSlug}
        </Link>
        <span className="mx-2 text-ui-text-tertiary">/</span>
        <Link
          to={ROUTES.workspaces.teams.detail(companySlug, workspaceSlug, teamSlug)}
          className="text-blue-600 hover:underline"
        >
          {teamSlug}
        </Link>
        <span className="mx-2 text-ui-text-tertiary">/</span>
        <span className="font-medium">{project.name}</span>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-primary dark:bg-ui-bg-primary-dark">
        <nav className="flex space-x-4 px-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              to={tab.href}
              className="border-b-2 py-3 px-1 text-sm font-medium transition-colors"
              activeProps={{
                className:
                  "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400",
              }}
              inactiveProps={{
                className:
                  "border-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark hover:border-ui-border-secondary dark:hover:border-ui-border-secondary-dark",
              }}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
