import { api } from "@convex/_generated/api";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app/$companySlug/projects/$key")({
  component: ProjectLayout,
});

function ProjectLayout() {
  const { companySlug, key } = Route.useParams();
  const location = useLocation();

  // Get project by key
  const project = useQuery(api.projects.getByKey, { key });

  if (project === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="flex h-full items-center justify-center text-ui-text-tertiary">
        <div className="text-center">
          <Typography variant="h2" className="text-xl font-medium mb-2">
            Project not found
          </Typography>
          <Typography variant="p" color="secondary">
            The project "{key}" does not exist or you don't have access to it.
          </Typography>
          <Link
            to={ROUTES.projects.list(companySlug)}
            className="mt-4 inline-block text-primary-600 hover:text-primary-700"
          >
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  // Determine active tab from current path
  const currentPath = location.pathname;
  const getTabClass = (tab: string) => {
    const isActive =
      currentPath.endsWith(`/${tab}`) || (tab === "board" && currentPath.endsWith(`/${key}`));
    return `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      isActive
        ? "border-brand-600 text-brand-600"
        : "border-transparent text-ui-text-secondary hover:text-ui-text-primary hover:border-ui-border-secondary"
    }`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Project Header */}
      <div className="border-b border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-primary dark:bg-ui-bg-secondary-dark">
        <div className="px-6 py-4">
          <Typography variant="h1" className="text-xl font-semibold">
            {project.name}
          </Typography>
          <Typography variant="p" color="secondary" className="text-sm">
            {project.key}
          </Typography>
        </div>
        {/* Tab Navigation */}
        <nav className="flex px-6 -mb-px">
          <Link to={ROUTES.projects.board(companySlug, key)} className={getTabClass("board")}>
            Board
          </Link>
          <Link to={ROUTES.projects.calendar(companySlug, key)} className={getTabClass("calendar")}>
            Calendar
          </Link>
          <Link
            to={ROUTES.projects.timesheet(companySlug, key)}
            className={getTabClass("timesheet")}
          >
            Timesheet
          </Link>
          {project.userRole === "admin" && (
            <Link
              to={ROUTES.projects.settings(companySlug, key)}
              className={getTabClass("settings")}
            >
              Settings
            </Link>
          )}
        </nav>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
