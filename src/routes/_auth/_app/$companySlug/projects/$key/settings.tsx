import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import React from "react";
import { ProjectSettings } from "@/components/ProjectSettings";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const Route = createFileRoute("/_auth/_app/$companySlug/projects/$key/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { key } = Route.useParams();
  const { companySlug } = Route.useParams();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const project = useQuery(api.projects.getByKey, { key });
  const userRole = useQuery(
    api.projects.getProjectUserRole,
    project ? { projectId: project._id } : "skip",
  );

  // Check if user is admin
  const isAdmin =
    project && userRole ? userRole === "admin" || project.createdBy === user?._id : false;

  // Redirect non-admin users to board
  React.useEffect(() => {
    if (project && userRole !== undefined && !isAdmin) {
      navigate({ to: ROUTES.projects.board(companySlug, key), replace: true });
    }
  }, [project, userRole, isAdmin, navigate, companySlug, key]);

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
          Project not found
        </Typography>
      </Flex>
    );
  }

  if (!isAdmin) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <LoadingSpinner message="Redirecting..." />
      </Flex>
    );
  }

  return (
    <ProjectSettings
      projectId={project._id}
      name={project.name}
      projectKey={project.key}
      description={project.description}
      workflowStates={project.workflowStates}
      members={project.members}
      createdBy={project.createdBy}
      ownerId={project.ownerId}
      isOwner={project.isOwner}
      companySlug={companySlug}
    />
  );
}
