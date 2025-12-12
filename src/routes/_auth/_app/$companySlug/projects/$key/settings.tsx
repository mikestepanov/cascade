import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { ProjectSettings } from "@/components/ProjectSettings";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app/$companySlug/projects/$key/settings")({
  component: ProjectSettingsPage,
});

function ProjectSettingsPage() {
  const { companySlug, key } = Route.useParams();
  const navigate = useNavigate();
  const project = useQuery(api.projects.getByKey, { key });

  // Redirect non-admins to board
  useEffect(() => {
    if (project && project.userRole !== "admin") {
      navigate({ to: ROUTES.projects.board(companySlug, key), replace: true });
    }
  }, [project, companySlug, key, navigate]);

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

  // Don't render content for non-admins (redirect is happening)
  if (project.userRole !== "admin") {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
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
    </div>
  );
}
