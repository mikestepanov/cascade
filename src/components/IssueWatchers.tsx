import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Typography } from "./ui/Typography";

interface IssueWatchersProps {
  issueId: Id<"issues">;
}

interface Watcher {
  _id: string;
  userName: string;
  userEmail?: string;
}

export function IssueWatchers({ issueId }: IssueWatchersProps) {
  const watchers = useQuery(api.watchers.getWatchers, { issueId });
  const isWatching = useQuery(api.watchers.isWatching, { issueId });
  const watch = useMutation(api.watchers.watch);
  const unwatch = useMutation(api.watchers.unwatch);

  const handleToggleWatch = async () => {
    try {
      if (isWatching) {
        await unwatch({ issueId });
        toast.success("Stopped watching this issue");
      } else {
        await watch({ issueId });
        toast.success("Now watching this issue");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update watch status");
    }
  };

  return (
    <div className="space-y-4">
      {/* Watch/Unwatch Button */}
      <div>
        <Button
          onClick={handleToggleWatch}
          variant={isWatching ? "secondary" : "primary"}
          size="sm"
          className="w-full sm:w-auto"
        >
          {isWatching ? (
            <>
              <svg aria-hidden="true" className="w-4 h-4 mr-2 fill-current" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              Watching
            </>
          ) : (
            <>
              <svg
                aria-hidden="true"
                className="w-4 h-4 mr-2 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Watch
            </>
          )}
        </Button>
      </div>

      {/* Watchers List */}
      {watchers && watchers.length > 0 && (
        <div>
          <Typography variant="h4" className="text-sm font-medium text-ui-text-primary mb-2">
            Watchers ({watchers.length})
          </Typography>
          <div className="space-y-2">
            {watchers.map((watcher: Watcher) => (
              <div
                key={watcher._id}
                className="flex items-center gap-3 p-2 bg-ui-bg-secondary rounded-lg"
              >
                {/* Avatar */}
                <Avatar name={watcher.userName} size="md" />

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <Typography variant="p" className="font-medium truncate">
                    {watcher.userName}
                  </Typography>
                  {watcher.userEmail && (
                    <Typography variant="muted" size="xs" className="truncate">
                      {watcher.userEmail}
                    </Typography>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {watchers && watchers.length === 0 && (
        <div className="text-center py-4 text-sm text-ui-text-secondary">
          No watchers yet. Be the first to watch this issue!
        </div>
      )}
    </div>
  );
}
