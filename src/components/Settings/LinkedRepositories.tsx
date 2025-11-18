import { useMutation, useQuery } from "convex/react";
import { Github, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";

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
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Linked Repositories
      </h4>

      {/* Project selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Project
        </label>
        <select
          value={selectedProject || ""}
          onChange={(e) => setSelectedProject(e.target.value as Id<"projects">)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
        <div className="space-y-2">
          {repositories && repositories.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No repositories linked to this project yet.
            </p>
          )}
          {repositories?.map((repo) => (
            <div
              key={repo._id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Github className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {repo.repoFullName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {repo.syncPRs && "PRs"} {repo.syncPRs && repo.autoLinkCommits && "• "}
                    {repo.autoLinkCommits && "Auto-link commits"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleUnlink(repo._id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
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
