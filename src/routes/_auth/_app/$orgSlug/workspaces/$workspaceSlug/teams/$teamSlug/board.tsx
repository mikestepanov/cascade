import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { PageContent, PageHeader } from "@/components/layout";
import { Flex } from "@/components/ui/Flex";
import { useOrganization } from "@/hooks/useOrgContext";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/board",
)({
  component: TeamBoardPage,
});

function TeamBoardPage() {
  const { organizationId } = useOrganization();
  const { workspaceSlug, teamSlug } = Route.useParams();

  const workspace = useQuery(api.workspaces.getBySlug, {
    organizationId,
    slug: workspaceSlug,
  });

  const team = useQuery(
    api.teams.getBySlug,
    workspace?._id
      ? {
          workspaceId: workspace._id,
          slug: teamSlug,
        }
      : "skip",
  );

  if (!team) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  return (
    <Flex direction="column" className="h-full">
      <div className="px-6 py-4 border-b border-ui-border-primary">
        <PageHeader title={`${team.name} Board`} className="mb-0" />
      </div>
      <KanbanBoard teamId={team._id} />
    </Flex>
  );
}
