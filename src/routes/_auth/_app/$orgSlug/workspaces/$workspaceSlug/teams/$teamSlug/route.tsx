import { api } from "@convex/_generated/api";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug",
)({
  component: TeamLayout,
});

function TeamLayout() {
  const { orgSlug } = useOrganization();
  const { workspaceSlug, teamSlug } = Route.useParams();

  const workspace = useQuery(api.workspaces.getBySlug, {
    slug: workspaceSlug,
  });

  const team = useQuery(api.teams.getBySlug, {
    slug: teamSlug,
  });

  if (workspace === undefined || team === undefined) {
    return (
      <Flex direction="column" align="center" justify="center" className="min-h-96">
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
          to={ROUTES.workspaces.list.path}
          params={{ orgSlug: orgSlug }}
          className="text-brand-600 hover:underline"
        >
          Workspaces
        </Link>
        <Typography as="span" variant="muted" className="mx-2">
          /
        </Typography>
        <Link
          to={ROUTES.workspaces.detail.path}
          params={{ orgSlug: orgSlug, workspaceSlug }}
          className="text-brand-600 hover:underline"
        >
          {workspace.name}
        </Link>
        <Typography as="span" variant="muted" className="mx-2">
          /
        </Typography>
        <Typography as="span" variant="small">
          {team.name}
        </Typography>
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
      <div className="border-b border-ui-border-primary mb-6">
        <nav className="flex gap-6">
          <Link
            to={ROUTES.workspaces.teams.detail.path}
            params={{ orgSlug: orgSlug, workspaceSlug, teamSlug }}
            className="px-1 py-3 border-b-2 border-brand-600 font-medium text-brand-600"
          >
            Projects
          </Link>
          <Link
            to={ROUTES.workspaces.teams.calendar.path}
            params={{ orgSlug: orgSlug, workspaceSlug, teamSlug }}
            className="px-1 py-3 border-b-2 border-transparent hover:border-ui-border-secondary text-ui-text-secondary hover:text-ui-text-primary"
          >
            Calendar
          </Link>
          <Link
            to={ROUTES.workspaces.teams.settings.path}
            params={{ orgSlug: orgSlug, workspaceSlug, teamSlug }}
            className="px-1 py-3 border-b-2 border-transparent hover:border-ui-border-secondary text-ui-text-secondary hover:text-ui-text-primary"
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
