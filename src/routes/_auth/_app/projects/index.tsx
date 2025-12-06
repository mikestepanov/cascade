import { createFileRoute } from "@tanstack/react-router";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute("/_auth/_app/projects/")({
  component: ProjectsListPage,
});

function ProjectsListPage() {
  return (
    <div className="flex h-full">
      <ProjectSidebar selectedProjectId={null} />
      <div className="flex-1 flex items-center justify-center text-ui-text-tertiary dark:text-ui-text-tertiary-dark p-4">
        <div className="text-center">
          <Typography variant="h2" className="text-xl font-medium mb-2 border-none">
            Welcome to project management
          </Typography>
          <Typography variant="p" color="tertiary">
            Select a project from the sidebar or create a new one to get started.
          </Typography>
        </div>
      </div>
    </div>
  );
}
