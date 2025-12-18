import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app/$companySlug/projects/$key/")({
  component: ProjectIndexPage,
});

function ProjectIndexPage() {
  const { key, companySlug } = Route.useParams();

  // Redirect to board by default
  return <Navigate to={ROUTES.projects.board(companySlug, key)} replace />;
}
