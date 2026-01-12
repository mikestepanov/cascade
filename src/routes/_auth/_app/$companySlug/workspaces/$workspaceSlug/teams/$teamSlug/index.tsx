import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { ROUTE_PATTERNS, ROUTES } from "@/config/routes";
import { useCompany } from "@/hooks/useCompanyContext";

export const Route = createFileRoute(
  "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/",
)({
  component: TeamHome,
});

function TeamHome() {
  const { company } = useCompany();
  const { workspaceSlug, teamSlug } = Route.useParams();
  const navigate = useNavigate();

  const team = useQuery(api.teams.getBySlug, {
    companyId: company._id,
    slug: teamSlug,
  });

  // Redirect to projects list
  useEffect(() => {
    if (team) {
      navigate({
        to: ROUTE_PATTERNS.workspaces.teams.projects.list,
        params: { companySlug: company.slug, workspaceSlug, teamSlug },
        replace: true,
      });
    }
  }, [team, company.slug, workspaceSlug, teamSlug, navigate]);

  return null;
}
