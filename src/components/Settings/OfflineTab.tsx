import { toast } from "sonner";
import { RefreshCw, Wifi, WifiOff } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useOfflineSyncStatus, useOnlineStatus } from "../../hooks/useOffline";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

/**
 * Offline mode settings tab
 * Extracted from Settings for better organization
 */
export function OfflineTab() {
  const isOnline = useOnlineStatus();
  const { pending, count, isLoading } = useOfflineSyncStatus();

  return (
    <Flex direction="column" gap="xl">
      {/* Connection Status */}
      <Card>
        <div className="p-6">
          <Flex gap="lg" align="center">
            <div
              className={cn("p-3 rounded-lg", isOnline ? "bg-status-success" : "bg-status-error")}
            >
              {isOnline ? (
                <Wifi className="h-6 w-6 text-white" />
              ) : (
                <WifiOff className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
                Connection Status
              </h3>
              <Typography
                className={cn(
                  "text-sm mt-1",
                  isOnline
                    ? "text-status-success dark:text-status-success"
                    : "text-status-error dark:text-status-error",
                )}
              >
                {isOnline ? "✓ You are online" : "✗ You are offline"}
              </Typography>
            </div>
          </Flex>

          <div className="mt-6 pt-6 border-t border-ui-border-primary dark:border-ui-border-primary-dark">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
                <Typography className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Pending Changes
                </Typography>
                <Typography className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mt-1">
                  {isLoading ? "..." : count}
                </Typography>
              </div>
              <div className="p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
                <Typography className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Sync Status
                </Typography>
                <Typography className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mt-1">
                  {isOnline ? "Ready" : "Paused"}
                </Typography>
              </div>
              <div className="p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
                <Typography className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Storage
                </Typography>
                <Typography className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mt-1">
                  IndexedDB
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Offline Features */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-4">
            Offline Features
          </h3>
          <Flex direction="column" gap="lg">
            <Flex gap="md" align="start">
              <div className="mt-0.5">✓</div>
              <div>
                <Typography className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                  View Cached Content
                </Typography>
                <Typography className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Access recently viewed projects and issues while offline
                </Typography>
              </div>
            </Flex>
            <Flex gap="md" align="start">
              <div className="mt-0.5">✓</div>
              <div>
                <Typography className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                  Offline Edits
                </Typography>
                <Typography className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Make changes offline - they'll sync automatically when you're back online
                </Typography>
              </div>
            </Flex>
            <Flex gap="md" align="start">
              <div className="mt-0.5">✓</div>
              <div>
                <Typography className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                  Background Sync
                </Typography>
                <Typography className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Changes sync automatically in the background when connection is restored
                </Typography>
              </div>
            </Flex>
            <Flex gap="md" align="start">
              <div className="mt-0.5">✓</div>
              <div>
                <Typography className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                  Install as App
                </Typography>
                <Typography className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Install Nixelo as a standalone app on your device
                </Typography>
              </div>
            </Flex>
          </Flex>
        </div>
      </Card>

      {/* Sync Queue */}
      {count > 0 && (
        <Card>
          <div className="p-6">
            <Flex justify="between" align="center" className="mb-4">
              <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
                Pending Sync Queue
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.info("Manual sync triggered")}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
            </Flex>
            <Flex direction="column" gap="sm">
              {pending.slice(0, 5).map((item) => (
                <Flex
                  key={item.id}
                  justify="between"
                  align="center"
                  className="p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg"
                >
                  <div>
                    <Typography className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                      {item.mutationType}
                    </Typography>
                    <Typography className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                      {new Date(item.timestamp).toLocaleString()}
                    </Typography>
                  </div>
                  <span className="text-xs px-2 py-1 bg-status-warning-bg dark:bg-status-warning-bg-dark text-status-warning-text dark:text-status-warning-text-dark rounded">
                    Pending
                  </span>
                </Flex>
              ))}
              {pending.length > 5 && (
                <Typography className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark text-center pt-2">
                  +{pending.length - 5} more items
                </Typography>
              )}
            </Flex>
          </div>
        </Card>
      )}
    </Flex>
  );
}
