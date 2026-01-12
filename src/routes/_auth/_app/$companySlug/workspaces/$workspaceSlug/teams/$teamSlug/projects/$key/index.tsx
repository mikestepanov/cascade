import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ROUTE_PATTERNS } from "@/config/routes";

export const Route = createFileRoute(
  "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/",
)({
  component: ProjectIndexPage,
});

function ProjectIndexPage() {
  const { key, companySlug, workspaceSlug, teamSlug } = Route.useParams();

  // Redirect to board by default
  return (
    <Navigate
      to={ROUTE_PATTERNS.workspaces.teams.projects.board}
      params={{ companySlug, workspaceSlug, teamSlug, key }}
      replace
    />
  );
}
