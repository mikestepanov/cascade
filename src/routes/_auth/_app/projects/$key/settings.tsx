import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";

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
      <Typography variant="h2" className="text-lg font-semibold mb-4">
        Project Settings
      </Typography>
      <div className="space-y-4">
        <div>
          <Typography variant="small" color="secondary" className="block mb-1">
            Project Name
          </Typography>
          <Typography variant="p" className="mt-0">
            {project.name}
          </Typography>
        </div>
        <div>
          <Typography variant="small" color="secondary" className="block mb-1">
            Project Key
          </Typography>
          <Typography variant="p" className="mt-0">
            {project.key}
          </Typography>
        </div>
        <div>
          <Typography variant="small" color="secondary" className="block mb-1">
            Description
          </Typography>
          <Typography variant="p" className="mt-0">
            {project.description || "No description"}
          </Typography>
        </div>
      </div>
    </div>
  );
}
