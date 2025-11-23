import { RefreshCw, Wifi, WifiOff } from "@/lib/icons";
import { toast } from "sonner";
import { useOfflineSyncStatus, useOnlineStatus } from "../../hooks/useOffline";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

/**
 * Offline mode settings tab
 * Extracted from Settings for better organization
 */
export function OfflineTab() {
  const isOnline = useOnlineStatus();
  const { pending, count, isLoading } = useOfflineSyncStatus();

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${isOnline ? "bg-status-success" : "bg-status-error"}`}>
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
              <p
                className={`text-sm mt-1 ${isOnline ? "text-status-success dark:text-status-success" : "text-status-error dark:text-status-error"}`}
              >
                {isOnline ? "✓ You are online" : "✗ You are offline"}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-ui-border-primary dark:border-ui-border-primary-dark">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
                <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Pending Changes
                </p>
                <p className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mt-1">
                  {isLoading ? "..." : count}
                </p>
              </div>
              <div className="p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
                <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Sync Status
                </p>
                <p className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mt-1">
                  {isOnline ? "Ready" : "Paused"}
                </p>
              </div>
              <div className="p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
                <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Storage
                </p>
                <p className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mt-1">
                  IndexedDB
                </p>
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
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">✓</div>
              <div>
                <p className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                  View Cached Content
                </p>
                <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Access recently viewed projects and issues while offline
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">✓</div>
              <div>
                <p className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                  Offline Edits
                </p>
                <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Make changes offline - they'll sync automatically when you're back online
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">✓</div>
              <div>
                <p className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                  Background Sync
                </p>
                <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Changes sync automatically in the background when connection is restored
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">✓</div>
              <div>
                <p className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                  Install as App
                </p>
                <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Install Cascade as a standalone app on your device
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Sync Queue */}
      {count > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
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
            </div>
            <div className="space-y-2">
              {pending.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                      {item.mutationType}
                    </p>
                    <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-status-warning-bg dark:bg-status-warning-bg-dark text-status-warning-text dark:text-status-warning-text-dark rounded">
                    Pending
                  </span>
                </div>
              ))}
              {pending.length > 5 && (
                <p className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark text-center pt-2">
                  +{pending.length - 5} more items
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
