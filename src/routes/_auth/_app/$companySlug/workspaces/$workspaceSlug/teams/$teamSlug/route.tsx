import { api } from "@convex/_generated/api";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTE_PATTERNS } from "@/config/routes";
import { useCompany } from "@/hooks/useCompanyContext";

export const Route = createFileRoute(
  "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug",
)({
  component: TeamLayout,
});

function TeamLayout() {
  const { company } = useCompany();
  const { workspaceSlug, teamSlug } = Route.useParams();

  const workspace = useQuery(api.workspaces.getBySlug, {
    companyId: company._id,
    slug: workspaceSlug,
  });

  const team = useQuery(api.teams.getBySlug, {
    companyId: company._id,
    slug: teamSlug,
  });

  if (workspace === undefined || team === undefined) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ minHeight: "400px" }}>
        <LoadingSpinner />
      </Flex>
    );
  }

  if (!(workspace && team)) {
    return (
      <div className="container mx-auto p-6">
        <Typography variant="h2">Team not found</Typography>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm">
        <Link
          to={ROUTE_PATTERNS.workspaces.list}
          params={{ companySlug: company.slug }}
          className="text-blue-600 hover:underline"
        >
          Workspaces
        </Link>
        <span className="mx-2">/</span>
        <Link
          to={ROUTE_PATTERNS.workspaces.detail}
          params={{ companySlug: company.slug, workspaceSlug }}
          className="text-blue-600 hover:underline"
        >
          {workspace.name}
        </Link>
        <span className="mx-2">/</span>
        <span>{team.name}</span>
      </div>

      {/* Team Header */}
      <div className="mb-8">
        <Flex align="center" gap="sm" className="mb-2">
          {team.icon && <span className="text-4xl">{team.icon}</span>}
          <Typography variant="h1">{team.name}</Typography>
        </Flex>
        {team.description && (
          <Typography variant="p" color="secondary">
            {team.description}
          </Typography>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          <Link
            to={ROUTE_PATTERNS.workspaces.teams.detail}
            params={{ companySlug: company.slug, workspaceSlug, teamSlug }}
            className="px-1 py-3 border-b-2 border-blue-600 font-medium text-blue-600"
          >
            Projects
          </Link>
          <Link
            to={ROUTE_PATTERNS.workspaces.teams.calendar}
            params={{ companySlug: company.slug, workspaceSlug, teamSlug }}
            className="px-1 py-3 border-b-2 border-transparent hover:border-gray-300 text-gray-600"
          >
            Calendar
          </Link>
          <Link
            to={ROUTE_PATTERNS.workspaces.teams.settings}
            params={{ companySlug: company.slug, workspaceSlug, teamSlug }}
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
