import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Github, Trash2 } from "@/lib/icons";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";

/**
 * GitHub linked repositories management
 * Extracted from Settings/GitHubIntegration for better organization
 */
export function LinkedRepositories() {
  const [selectedProject, setSelectedProject] = useState<Id<"projects"> | null>(null);
  const projects = useQuery(api.projects.list, {});
  const repositories = useQuery(
    api.github.listRepositories,
    selectedProject ? { projectId: selectedProject } : "skip",
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
        <select
          id="project-selector"
          value={selectedProject || ""}
          onChange={(e) => setSelectedProject(e.target.value as Id<"projects">)}
          className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
        >
          <option value="">-- Select a project --</option>
          {projects?.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name} ({project.key})
            </option>
          ))}
        </select>
      </div>

      {/* Repository list */}
      {selectedProject && (
        <Flex direction="column" gap="sm">
          {repositories && repositories.length === 0 && (
            <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark italic">
              No repositories linked to this project yet.
            </p>
          )}
          {repositories?.map((repo) => (
            <Flex
              key={repo._id}
              justify="between"
              align="center"
              className="p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg"
            >
              <Flex gap="md" align="center">
                <Github className="h-5 w-5 text-ui-text-tertiary dark:text-ui-text-tertiary-dark" />
                <div>
                  <p className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                    {repo.repoFullName}
                  </p>
                  <p className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                    {repo.syncPRs && "PRs"} {repo.syncPRs && repo.autoLinkCommits && "• "}
                    {repo.autoLinkCommits && "Auto-link commits"}
                  </p>
                </div>
              </Flex>
              <Button variant="ghost" size="sm" onClick={() => handleUnlink(repo._id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Flex>
          ))}
        </Flex>
      )}

      {selectedProject && (
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
