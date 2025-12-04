import { useQuery } from "convex/react";
import { useState } from "react";
import { getConvexSiteUrl } from "@/lib/convex";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/Button";

/**
 * Developer Tools Tab
 *
 * Only visible in development mode.
 * Provides utilities for testing and debugging.
 */
export function DevToolsTab() {
  const currentUser = useQuery(api.users.getCurrent);
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false);

  const handleResetOnboarding = async () => {
    if (!currentUser?.email) {
      showError("No user email found");
      return;
    }

    setIsResettingOnboarding(true);
    try {
      const response = await fetch(`${getConvexSiteUrl()}/e2e/reset-onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: currentUser.email }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showSuccess("Onboarding reset! Refresh the page to see onboarding again.");
      } else {
        showError(result.error || "Failed to reset onboarding");
      }
    } catch (error) {
      showError(error, "Failed to reset onboarding");
    } finally {
      setIsResettingOnboarding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-600 dark:text-blue-400 text-xl">&#128736;</span>
          <div>
            <h3 className="font-medium text-blue-800 dark:text-blue-200">Test Account Tools</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              These tools are only visible for test accounts (@inbox.mailtrap.io).
            </p>
          </div>
        </div>
      </div>

      {/* Onboarding Section */}
      <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg border border-ui-border-primary dark:border-ui-border-primary-dark p-6">
        <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
          Onboarding
        </h3>
        <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mb-4">
          Reset your onboarding state to test the onboarding flow again. After resetting, refresh
          the page to see the onboarding wizard.
        </p>
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
        <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
          Current User Info
        </h3>
        {currentUser ? (
          <div className="text-sm space-y-2">
            <div className="flex gap-2">
              <span className="text-ui-text-secondary dark:text-ui-text-secondary-dark">ID:</span>
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
          <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
            Loading user info...
          </p>
        )}
      </div>
    </div>
  );
}
