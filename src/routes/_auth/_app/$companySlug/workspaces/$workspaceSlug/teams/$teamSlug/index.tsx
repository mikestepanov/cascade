import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { ROUTE_PATTERNS } from "@/config/routes";
import { useCompany } from "@/hooks/useCompanyContext";

export const Route = createFileRoute(
  "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/",
)({
  component: TeamHome,
});

function TeamHome() {
  const { companyId, companySlug } = useCompany();
  const { workspaceSlug, teamSlug } = Route.useParams();
  const navigate = useNavigate();

  const team = useQuery(api.teams.getBySlug, {
    companyId: companyId,
    slug: teamSlug,
  });

  // Redirect to projects list
  useEffect(() => {
    if (team) {
      navigate({
        to: ROUTE_PATTERNS.workspaces.teams.projects.list,
        params: { companySlug, workspaceSlug, teamSlug },
        replace: true,
      });
    }
  }, [team, companySlug, workspaceSlug, teamSlug, navigate]);

  return null;
}
