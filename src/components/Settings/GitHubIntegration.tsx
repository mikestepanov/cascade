import { useMutation, useQuery } from "convex/react";
import { Github } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { LinkedRepositories } from "./LinkedRepositories";

/**
 * GitHub integration card
 * Extracted from Settings for better organization
 */
export function GitHubIntegration() {
  const githubConnection = useQuery(api.github.getConnection);
  const disconnectGitHub = useMutation(api.github.disconnectGitHub);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect GitHub? This will remove all linked repositories.",
      )
    ) {
      return;
    }

    setIsDisconnecting(true);
    try {
      await disconnectGitHub();
      showSuccess("GitHub disconnected successfully");
    } catch (error) {
      showError(error, "Failed to disconnect GitHub");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConnect = () => {
    toast.info("GitHub OAuth not yet implemented. Please set up OAuth in convex/auth.config.ts");
    // TODO: Implement GitHub OAuth flow
    // window.location.href = "/auth/github";
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gray-900 dark:bg-gray-800 rounded-lg">
              <Github className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">GitHub</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Link repositories and track PRs and commits
              </p>
              {githubConnection && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  ✓ Connected as @{githubConnection.githubUsername}
                </p>
              )}
            </div>
          </div>
          <div>
            {githubConnection ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleConnect}>
                Connect GitHub
              </Button>
            )}
          </div>
        </div>

        {githubConnection && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <LinkedRepositories />
          </div>
        )}
      </div>
    </Card>
  );
}
