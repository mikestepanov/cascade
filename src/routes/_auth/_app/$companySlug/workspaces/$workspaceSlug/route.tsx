import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useCompany } from "@/contexts/CompanyContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute(
  "/_auth/_app/$companySlug/workspaces/$workspaceSlug"
)({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { company } = useCompany();
  const { workspaceSlug } = Route.useParams();
  
  const workspace = useQuery(api.workspaces.getBySlug, {
    companyId: company._id,
    slug: workspaceSlug,
  });

  if (workspace === undefined) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ minHeight: "400px" }}>
        <LoadingSpinner />
      </Flex>
    );
  }

  if (workspace === null) {
    return (
      <div className="container mx-auto p-6">
        <Typography variant="h2">Workspace not found</Typography>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm">
        <Link
          to={ROUTES.workspaces.list(company.slug)}
          className="text-blue-600 hover:underline"
        >
          Workspaces
        </Link>
        <span className="mx-2">/</span>
        <span>{workspace.name}</span>
      </div>

      {/* Workspace Header */}
      <div className="mb-8">
        <Flex align="center" gap="sm" className="mb-2">
          {workspace.icon && <span className="text-4xl">{workspace.icon}</span>}
          <Typography variant="h1">{workspace.name}</Typography>
        </Flex>
        {workspace.description && (
          <Typography variant="p" color="secondary">
            {workspace.description}
          </Typography>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          <Link
            to={ROUTES.workspaces.detail(company.slug, workspaceSlug)}
            className="px-1 py-3 border-b-2 border-blue-600 font-medium text-blue-600"
          >
            Teams
          </Link>
          <Link
            to={ROUTES.workspaces.settings(company.slug, workspaceSlug)}
            className="px-1 py-3 border-b-2 border-transparent hover:border-gray-300 text-gray-600"
          >
            Settings
          </Link>
        </nav>
      </div>

      {/* Content */}
      <Outlet />
    </div>
  );
}
