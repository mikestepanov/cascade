import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ExportButton } from "@/components/ExportButton";
import { KanbanBoard } from "@/components/KanbanBoard";
import { PageContent, PageError } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Flex } from "@/components/ui/Flex";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Typography } from "@/components/ui/Typography";

interface BoardSearch {
  sprint?: string;
}

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/board")({
  component: BoardPage,
  validateSearch: (search: Record<string, unknown>): BoardSearch => ({
    sprint: typeof search.sprint === "string" ? search.sprint : undefined,
  }),
});

function BoardPage() {
  const { key } = Route.useParams();
  const { sprint: sprintParam } = Route.useSearch();
  const navigate = useNavigate();

  const project = useQuery(api.projects.getByKey, { key });
  const sprints = useQuery(
    api.sprints.listByProject,
    project ? { projectId: project._id } : "skip",
  );

  if (project === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  if (!project) {
    return (
      <PageError
        title="Project Not Found"
        message={`The project "${key}" doesn't exist or you don't have access to it.`}
      />
    );
  }

  const activeSprint = sprints?.find((s: Doc<"sprints">) => s.status === "active");
  const selectedSprintId = sprintParam as Id<"sprints"> | undefined;
  const effectiveSprintId = selectedSprintId || activeSprint?._id;

  const handleSprintChange = (value: string) => {
    navigate({
      search: (prev: BoardSearch) => ({
        ...prev,
        sprint: value === "active" ? undefined : value,
      }),
      replace: true,
    });
  };

  return (
    <Flex direction="column" className="h-full">
      {/* Board Header */}
      <div className="border-b border-ui-border-primary p-3 sm:p-4">
        <Flex align="center" justify="between" gap="md">
          <Flex align="center" gap="sm">
            <Typography variant="h3" className="text-lg font-semibold">
              {project.name}
            </Typography>
            <Badge variant="neutral" size="md">
              {project.key}
            </Badge>
            <Badge variant="accent" size="md">
              {project.boardType}
            </Badge>
          </Flex>
          <Flex align="center" gap="sm">
            <ExportButton projectId={project._id} sprintId={effectiveSprintId} />
            {project.boardType === "scrum" && sprints && (
              <Select value={selectedSprintId || "active"} onValueChange={handleSprintChange}>
                <SelectTrigger className="w-48 px-3 py-2 border border-ui-border-primary rounded-md text-sm">
                  <SelectValue placeholder="Active Sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active Sprint</SelectItem>
                  {sprints.map((sprint: Doc<"sprints">) => (
                    <SelectItem key={sprint._id} value={sprint._id}>
                      {sprint.name} ({sprint.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Flex>
        </Flex>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard projectId={project._id} sprintId={effectiveSprintId} />
      </div>
    </Flex>
  );
}
