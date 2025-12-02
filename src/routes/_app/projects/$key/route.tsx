import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { api } from "../../../../../convex/_generated/api";

export const Route = createFileRoute("/_app/projects/$key")({
  component: ProjectLayout,
});

function ProjectLayout() {
  const { key } = Route.useParams();
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
          <h2 className="text-xl font-medium mb-2 text-ui-text-primary dark:text-ui-text-primary-dark">
            Project not found
          </h2>
          <p>The project "{key}" does not exist or you don't have access to it.</p>
          <Link
            to="/projects"
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
        ? "border-primary-600 text-primary-600"
        : "border-transparent text-ui-text-secondary hover:text-ui-text-primary hover:border-gray-300"
    }`;
  };

  return (
    <div className="flex h-full">
      <ProjectSidebar selectedProjectId={project._id} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Project Header */}
        <div className="border-b border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-primary dark:bg-ui-bg-secondary-dark">
          <div className="px-6 py-4">
            <h1 className="text-xl font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
              {project.name}
            </h1>
            <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
              {project.key}
            </p>
          </div>
          {/* Tab Navigation */}
          <nav className="flex px-6 -mb-px">
            <Link to={`/projects/${key}/board`} className={getTabClass("board")}>
              Board
            </Link>
            <Link to={`/projects/${key}/calendar`} className={getTabClass("calendar")}>
              Calendar
            </Link>
            <Link to={`/projects/${key}/timesheet`} className={getTabClass("timesheet")}>
              Timesheet
            </Link>
            <Link to={`/projects/${key}/settings`} className={getTabClass("settings")}>
              Settings
            </Link>
          </nav>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
