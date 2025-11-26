import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Switch } from "../ui/Switch";

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
        <Flex justify="between" align="start">
          <Flex gap="lg" align="center">
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
                <Flex direction="column" gap="xs" className="mt-2">
                  <p className="text-sm text-status-success dark:text-status-success">
                    ✓ Connected to {calendarConnection.providerAccountId}
                  </p>
                  {calendarConnection.lastSyncAt && (
                    <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                      Last synced: {new Date(calendarConnection.lastSyncAt).toLocaleString()}
                    </p>
                  )}
                </Flex>
              )}
            </div>
          </Flex>
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
        </Flex>

        {calendarConnection && (
          <Flex direction="column" gap="xl" className="mt-6 pt-6 border-t border-ui-border-primary dark:border-ui-border-primary-dark">
            {/* Sync Toggle */}
            <Flex justify="between" align="center">
              <div>
                <h4 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
                  Enable Sync
                </h4>
                <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1">
                  Automatically sync events between Cascade and Google Calendar
                </p>
              </div>
              <Switch
                checked={calendarConnection.syncEnabled}
                onCheckedChange={handleToggleSync}
                disabled={isSaving}
              />
            </Flex>

            {/* Sync Direction */}
            {calendarConnection.syncEnabled && (
              <div>
                <h4 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
                  Sync Direction
                </h4>
                <Flex direction="column" gap="sm">
                  <label className="cursor-pointer hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark">
                    <Flex gap="md" align="center" className="p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
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
                    </Flex>
                  </label>

                  <label className="cursor-pointer hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark">
                    <Flex gap="md" align="center" className="p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
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
                    </Flex>
                  </label>

                  <label className="cursor-pointer hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark">
                    <Flex gap="md" align="center" className="p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
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
                    </Flex>
                  </label>
                </Flex>
              </div>
            )}
          </Flex>
        )}
      </div>
    </Card>
  );
}
