import { useMutation, useQuery } from "convex/react";
import { Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

/**
 * Google Calendar integration card
 * Extracted from Settings for better organization
 */
export function GoogleCalendarIntegration() {
  const calendarConnection = useQuery(api.googleCalendar.getConnection);
  const disconnectGoogle = useMutation(api.googleCalendar.disconnectGoogle);
  const updateSyncSettings = useMutation(api.googleCalendar.updateSyncSettings);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Calendar?")) {
      return;
    }

    setIsDisconnecting(true);
    try {
      await disconnectGoogle();
      toast.success("Google Calendar disconnected successfully");
    } catch (_error) {
      toast.error("Failed to disconnect Google Calendar");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConnect = () => {
    toast.info("Google OAuth not yet implemented. Please set up OAuth in convex/auth.config.ts");
    // TODO: Implement Google OAuth flow
    // window.location.href = "/auth/google";
  };

  const handleToggleSync = async () => {
    if (!calendarConnection) return;

    setIsSaving(true);
    try {
      await updateSyncSettings({
        syncEnabled: !calendarConnection.syncEnabled,
      });
      toast.success(`Sync ${!calendarConnection.syncEnabled ? "enabled" : "disabled"}`);
    } catch (_error) {
      toast.error("Failed to update sync settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeSyncDirection = async (direction: "import" | "export" | "bidirectional") => {
    setIsSaving(true);
    try {
      await updateSyncSettings({
        syncDirection: direction,
      });
      toast.success("Sync direction updated");
    } catch (_error) {
      toast.error("Failed to update sync direction");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Google Calendar
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Sync calendar events between Cascade and Google Calendar
              </p>
              {calendarConnection && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ Connected to {calendarConnection.providerAccountId}
                  </p>
                  {calendarConnection.lastSyncAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last synced: {new Date(calendarConnection.lastSyncAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div>
            {calendarConnection ? (
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
                Connect Google
              </Button>
            )}
          </div>
        </div>

        {calendarConnection && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-6">
            {/* Sync Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Enable Sync
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Automatically sync events between Cascade and Google Calendar
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleSync}
                disabled={isSaving}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${calendarConnection.syncEnabled ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${calendarConnection.syncEnabled ? "translate-x-5" : "translate-x-0"}
                  `}
                />
              </button>
            </div>

            {/* Sync Direction */}
            {calendarConnection.syncEnabled && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Sync Direction
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="syncDirection"
                      checked={calendarConnection.syncDirection === "bidirectional"}
                      onChange={() => handleChangeSyncDirection("bidirectional")}
                      disabled={isSaving}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Bidirectional
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Sync both ways (recommended)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="syncDirection"
                      checked={calendarConnection.syncDirection === "import"}
                      onChange={() => handleChangeSyncDirection("import")}
                      disabled={isSaving}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Import Only
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Only import from Google → Cascade
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="syncDirection"
                      checked={calendarConnection.syncDirection === "export"}
                      onChange={() => handleChangeSyncDirection("export")}
                      disabled={isSaving}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Export Only
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Only export from Cascade → Google
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
