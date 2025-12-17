import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useCompany } from "@/contexts/CompanyContext";
import { ROUTES } from "@/config/routes";
import { useEffect } from "react";

export const Route = createFileRoute(
  "/_auth/_app/$companySlug/workspaces/$workspaceSlug/"
)({
  component: WorkspaceHome,
});

function WorkspaceHome() {
  const { company } = useCompany();
  const { workspaceSlug } = Route.useParams();
  const navigate = useNavigate();
  
  const workspace = useQuery(api.workspaces.getBySlug, {
    companyId: company._id,
    slug: workspaceSlug,
  });

  // Redirect to teams list
  useEffect(() => {
    if (workspace) {
      navigate({
        to: ROUTES.workspaces.teams.list(company.slug, workspaceSlug),
        replace: true,
      });
    }
  }, [workspace, company.slug, workspaceSlug, navigate]);

  return null;
}
