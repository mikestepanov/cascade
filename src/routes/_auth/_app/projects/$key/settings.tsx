import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export const Route = createFileRoute("/_auth/_app/projects/$key/settings")({
  component: ProjectSettingsPage,
});

function ProjectSettingsPage() {
  const { key } = Route.useParams();
  const project = useQuery(api.projects.getByKey, { key });

  if (project === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (project === null) {
    return null; // Parent layout handles this
  }

  // TODO: Create a proper ProjectSettings component
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Project Settings</h2>
      <div className="space-y-4">
        <div>
          <span className="block text-sm font-medium text-ui-text-secondary mb-1">
            Project Name
          </span>
          <p className="text-ui-text-primary">{project.name}</p>
        </div>
        <div>
          <span className="block text-sm font-medium text-ui-text-secondary mb-1">Project Key</span>
          <p className="text-ui-text-primary">{project.key}</p>
        </div>
        <div>
          <span className="block text-sm font-medium text-ui-text-secondary mb-1">Description</span>
          <p className="text-ui-text-primary">{project.description || "No description"}</p>
        </div>
      </div>
    </div>
  );
}
