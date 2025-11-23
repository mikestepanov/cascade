import { useMutation, useQuery } from "convex/react";
import { Calendar } from "@/lib/icons";
import { useState } from "react";
import { toast } from "sonner";
import { showError, showSuccess } from "@/lib/toast";
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
      showSuccess("Google Calendar disconnected successfully");
    } catch (error) {
      showError(error, "Failed to disconnect Google Calendar");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConnect = () => {
    // Open OAuth flow in popup window
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      "/google/auth",
      "Google Calendar OAuth",
      `width=${width},height=${height},left=${left},top=${top},popup=yes`,
    );

    if (!popup) {
      toast.error("Please allow popups to connect to Google Calendar");
      return;
    }

    // Listen for popup close (successful auth will reload the page)
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        // Popup closed, connection may have been established
        // The popup auto-reloads the opener on success
      }
    }, 500);
  };

  const handleToggleSync = async () => {
    if (!calendarConnection) return;

    setIsSaving(true);
    try {
      await updateSyncSettings({
        syncEnabled: !calendarConnection.syncEnabled,
      });
      showSuccess(`Sync ${!calendarConnection.syncEnabled ? "enabled" : "disabled"}`);
    } catch (error) {
      showError(error, "Failed to update sync settings");
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
      showSuccess("Sync direction updated");
    } catch (error) {
      showError(error, "Failed to update sync direction");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-brand-500 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
                Google Calendar
              </h3>
              <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1">
                Sync calendar events between Cascade and Google Calendar
              </p>
              {calendarConnection && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-status-success dark:text-status-success">
                    ✓ Connected to {calendarConnection.providerAccountId}
                  </p>
                  {calendarConnection.lastSyncAt && (
                    <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
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
          <div className="mt-6 pt-6 border-t border-ui-border-primary dark:border-ui-border-primary-dark space-y-6">
            {/* Sync Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
                  Enable Sync
                </h4>
                <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1">
                  Automatically sync events between Cascade and Google Calendar
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleSync}
                disabled={isSaving}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
                  ${calendarConnection.syncEnabled ? "bg-brand-600" : "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark"}
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
                <h4 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
                  Sync Direction
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg cursor-pointer hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark">
                    <input
                      type="radio"
                      name="syncDirection"
                      checked={calendarConnection.syncDirection === "bidirectional"}
                      onChange={() => handleChangeSyncDirection("bidirectional")}
                      disabled={isSaving}
                      className="h-4 w-4 text-brand-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                        Bidirectional
                      </p>
                      <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                        Sync both ways (recommended)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg cursor-pointer hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark">
                    <input
                      type="radio"
                      name="syncDirection"
                      checked={calendarConnection.syncDirection === "import"}
                      onChange={() => handleChangeSyncDirection("import")}
                      disabled={isSaving}
                      className="h-4 w-4 text-brand-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                        Import Only
                      </p>
                      <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                        Only import from Google → Cascade
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg cursor-pointer hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark">
                    <input
                      type="radio"
                      name="syncDirection"
                      checked={calendarConnection.syncDirection === "export"}
                      onChange={() => handleChangeSyncDirection("export")}
                      disabled={isSaving}
                      className="h-4 w-4 text-brand-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                        Export Only
                      </p>
                      <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
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
