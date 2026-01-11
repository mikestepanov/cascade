import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Typography } from "../ui/Typography";

/**
 * Developer Tools Tab
 *
 * Only visible in development mode.
 * Provides utilities for testing and debugging.
 */
export function DevToolsTab() {
  const currentUser = useQuery(api.users.getCurrent);
  const resetOnboardingMutation = useMutation(api.onboarding.resetOnboarding);
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false);

  const handleResetOnboarding = async () => {
    setIsResettingOnboarding(true);
    try {
      await resetOnboardingMutation();
      showSuccess("Onboarding reset! Refresh the page to see onboarding again.");
    } catch (error) {
      showError(error, "Failed to reset onboarding");
    } finally {
      setIsResettingOnboarding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-status-info-bg dark:bg-status-info-bg-dark border border-status-info dark:border-status-info-bg-dark rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-status-info-text dark:text-status-info-text-dark text-xl">
            &#128736;
          </span>
          <div>
            <h3 className="font-medium text-status-info-text dark:text-status-info-text-dark">
              Test Account Tools
            </h3>
            <Typography className="text-sm text-status-info-text dark:text-status-info-text-dark mt-1">
              These tools are only visible for test accounts (@inbox.mailtrap.io).
            </Typography>
          </div>
        </div>
      </div>

      {/* Onboarding Section */}
      <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg border border-ui-border-primary dark:border-ui-border-primary-dark p-6">
        <Typography variant="h3" className="mb-2">
          Onboarding
        </Typography>
        <Typography variant="p" color="secondary" className="mb-4 text-sm">
          Reset your onboarding state to test the onboarding flow again. After resetting, refresh
          the page to see the onboarding wizard.
        </Typography>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleResetOnboarding}
            disabled={isResettingOnboarding || !currentUser}
            variant="secondary"
          >
            {isResettingOnboarding ? "Resetting..." : "Reset Onboarding"}
          </Button>
          {currentUser?.email && (
            <span className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
              Current user: {currentUser.email}
            </span>
          )}
        </div>
      </div>

      {/* User Info Section */}
      <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg border border-ui-border-primary dark:border-ui-border-primary-dark p-6">
        <Typography variant="h3" className="mb-2">
          Current User Info
        </Typography>
        {currentUser ? (
          <div className="text-sm space-y-2">
            <div className="flex gap-2">
              <Typography variant="small" color="secondary">
                ID:
              </Typography>
              <code className="text-ui-text-primary dark:text-ui-text-primary-dark font-mono">
                {currentUser._id}
              </code>
            </div>
            <div className="flex gap-2">
              <span className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
                Email:
              </span>
              <code className="text-ui-text-primary dark:text-ui-text-primary-dark font-mono">
                {currentUser.email}
              </code>
            </div>
            <div className="flex gap-2">
              <span className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
                Test User:
              </span>
              <code className="text-ui-text-primary dark:text-ui-text-primary-dark font-mono">
                {currentUser.isTestUser ? "Yes" : "No"}
              </code>
            </div>
          </div>
        ) : (
          <Typography className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
            Loading user info...
          </Typography>
        )}
      </div>
    </div>
  );
}
