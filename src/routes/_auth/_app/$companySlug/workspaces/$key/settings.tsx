import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ProjectSettings } from "@/components/ProjectSettings";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "../../../../../../convex/_generated/api";

export const Route = createFileRoute("/_auth/_app/$companySlug/workspaces/$key/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { key } = Route.useParams();
  const { user } = useCurrentUser();
  const project = useQuery(api.workspaces.getByKey, { key });
  const userRole = useQuery(
    api.workspaces.getUserRole,
    project ? { workspaceId: project._id } : "skip",
  );

  if (project === undefined || userRole === undefined) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <LoadingSpinner message="Loading settings..." />
      </Flex>
    );
  }

  if (!project) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <Typography variant="p" color="secondary">
          Workspace not found
        </Typography>
      </Flex>
    );
  }

  // Check if user is admin
  const isAdmin = userRole === "admin" || project.createdBy === user?._id;

  if (!isAdmin) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <div className="text-center">
          <Typography variant="h3" className="mb-2">
            Access Denied
          </Typography>
          <Typography variant="p" color="secondary">
            You need admin permissions to access workspace settings.
          </Typography>
        </div>
      </Flex>
    );
  }

  return <ProjectSettings workspaceId={project._id} />;
}
