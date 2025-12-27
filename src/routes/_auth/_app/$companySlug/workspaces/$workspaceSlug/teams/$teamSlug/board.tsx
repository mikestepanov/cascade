import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCompany } from "@/hooks/useCompanyContext";

export const Route = createFileRoute(
  "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/board",
)({
  component: TeamBoardPage,
});

function TeamBoardPage() {
  const { company } = useCompany();
  const { teamSlug } = Route.useParams();

  const team = useQuery(api.teams.getBySlug, {
    companyId: company._id,
    slug: teamSlug,
  });

  if (!team) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="flex gap-4">
          <Skeleton className="h-96 w-72" />
          <Skeleton className="h-96 w-72" />
          <Skeleton className="h-96 w-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark">
        <h1 className="text-2xl font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
          {team.name} Board
        </h1>
      </div>
      <KanbanBoard teamId={team._id} />
    </div>
  );
}
