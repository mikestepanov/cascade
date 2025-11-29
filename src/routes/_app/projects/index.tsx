import { createFileRoute } from "@tanstack/react-router";
import { ProjectSidebar } from "@/components/ProjectSidebar";

export const Route = createFileRoute("/_app/projects/")({
  component: ProjectsListPage,
});

function ProjectsListPage() {
  return (
    <div className="flex h-full">
      <ProjectSidebar selectedProjectId={null} />
      <div className="flex-1 flex items-center justify-center text-ui-text-tertiary dark:text-ui-text-tertiary-dark p-4">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2 text-ui-text-primary dark:text-ui-text-primary-dark">
            Welcome to project management
          </h2>
          <p>Select a project from the sidebar or create a new one to get started.</p>
        </div>
      </div>
    </div>
  );
}
