import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Github, Trash2 } from "@/lib/icons";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Typography } from "../ui/Typography";

/**
 * GitHub linked repositories management
 * Extracted from Settings/GitHubIntegration for better organization
 */
export function LinkedRepositories() {
  const [selectedWorkspace, setSelectedWorkspace] = useState<Id<"projects"> | null>(null);
  const projects = useQuery(api.projects.getCurrentUserProjects, {});
  const repositories = useQuery(
    api.github.listRepositories,
    selectedWorkspace ? { projectId: selectedWorkspace } : "skip",
  );
  const unlinkRepo = useMutation(api.github.unlinkRepository);

  const handleUnlink = async (repoId: Id<"githubRepositories">) => {
    if (!confirm("Are you sure you want to unlink this repository?")) {
      return;
    }

    try {
      await unlinkRepo({ repositoryId: repoId });
      toast.success("Repository unlinked");
    } catch (_error) {
      toast.error("Failed to unlink repository");
    }
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-4">
        Linked Repositories
      </h4>

      {/* Project selector */}
      <div className="mb-4">
        <label
          htmlFor="project-selector"
          className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-2"
        >
          Select Project
        </label>
        <Select
          value={selectedWorkspace || ""}
          onValueChange={(value) => setSelectedWorkspace(value as Id<"projects">)}
        >
          <SelectTrigger className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark">
            <SelectValue placeholder="-- Select a project --" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">-- Select a project --</SelectItem>
            {projects?.page?.map((project: Doc<"projects">) => (
              <SelectItem key={project._id} value={project._id}>
                {project.name} ({project.key})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Repository list */}
      {selectedWorkspace && (
        <Flex direction="column" gap="sm">
          {repositories && repositories.length === 0 && (
            <Typography className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark italic">
              No repositories linked to this project yet.
            </Typography>
          )}
          {repositories?.map((repo: Doc<"githubRepositories">) => (
            <Flex
              key={repo._id}
              justify="between"
              align="center"
              className="p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg"
            >
              <Flex gap="md" align="center">
                <Github className="h-5 w-5 text-ui-text-tertiary dark:text-ui-text-tertiary-dark" />
                <div>
                  <Typography className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                    {repo.repoFullName}
                  </Typography>
                  <Typography className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                    {repo.syncPRs && "PRs"} {repo.syncPRs && repo.autoLinkCommits && "• "}
                    {repo.autoLinkCommits && "Auto-link commits"}
                  </Typography>
                </div>
              </Flex>
              <Button variant="ghost" size="sm" onClick={() => handleUnlink(repo._id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Flex>
          ))}
        </Flex>
      )}

      {selectedWorkspace && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => toast.info("Repository linking UI coming soon")}
        >
          + Link New Repository
        </Button>
      )}
    </div>
  );
}
