import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { ROUTE_PATTERNS } from "@/config/routes";
import { useCompany } from "@/hooks/useCompanyContext";

export const Route = createFileRoute("/_auth/_app/$companySlug/workspaces/$workspaceSlug/")({
  component: WorkspaceHome,
});

function WorkspaceHome() {
  const { companyId, companySlug } = useCompany();
  const { workspaceSlug } = Route.useParams();
  const navigate = useNavigate();

  const workspace = useQuery(api.workspaces.getBySlug, {
    companyId: companyId,
    slug: workspaceSlug,
  });

  // Redirect to teams list
  useEffect(() => {
    if (workspace) {
      navigate({
        to: ROUTE_PATTERNS.workspaces.teams.list,
        params: { companySlug, workspaceSlug },
        replace: true,
      });
    }
  }, [workspace, companySlug, workspaceSlug, navigate]);

  return null;
}
