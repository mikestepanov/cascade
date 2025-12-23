import { api } from "@convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useCompany } from "@/hooks/useCompanyContext";

export const Route = createFileRoute("/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/")({
  component: TeamsList,
});

function TeamsList() {
  const { companyId, companySlug } = useCompany();
  const { workspaceSlug } = Route.useParams();

  const workspace = useQuery(api.workspaces.getBySlug, {
    companyId,
    slug: workspaceSlug,
  });

  // For now, teams are company-wide, but we'll filter by workspace later
  const allTeams = useQuery(api.teams.list, { companyId });

  if (!workspace || allTeams === undefined) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ minHeight: "400px" }}>
        <LoadingSpinner />
      </Flex>
    );
  }

  // TODO: Filter teams by workspaceId once we migrate data
  const teams = allTeams || [];

  return (
    <Flex direction="column" gap="lg">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <div>
          <Typography variant="h2">Teams</Typography>
          <Typography variant="p" color="secondary">
            Organize your workspace into focused teams
          </Typography>
        </div>
        <Button variant="primary">+ Create Team</Button>
      </Flex>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <EmptyState
          title="No teams yet"
          description="Create your first team to start organizing work"
          action={<Button variant="primary">+ Create Team</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Link
              key={team._id}
              to={ROUTES.workspaces.teams.detail(companySlug, workspaceSlug, team.slug)}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <Flex direction="column" gap="md">
                  <Flex align="center" gap="sm">
                    {team.icon && <span className="text-3xl">{team.icon}</span>}
                    <Typography variant="h3">{team.name}</Typography>
                  </Flex>

                  {team.description && (
                    <Typography variant="p" color="secondary">
                      {team.description}
                    </Typography>
                  )}

                  <Flex gap="md" className="text-sm text-gray-500">
                    <span>0 members</span>
                    <span>•</span>
                    <span>0 projects</span>
                  </Flex>
                </Flex>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Flex>
  );
}
