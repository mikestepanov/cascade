import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";
import { useCompany } from "@/contexts/CompanyContext";

export const Route = createFileRoute("/_auth/_app/$companySlug/projects/$key/")({
  component: ProjectIndexPage,
});

function ProjectIndexPage() {
  const { key } = Route.useParams();
  const { company } = useCompany();
  const companySlug = company?.slug ?? "";

  // Redirect to board by default
  return <Navigate to={ROUTES.projects.board(companySlug, key)} replace />;
}
