/**
 * Notification Preferences
 *
 * Allows users to configure their email notification preferences
 */

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";

export function NotificationPreferences() {
  const preferences = useQuery(api.notificationPreferences.get);
  const updatePreferences = useMutation(api.notificationPreferences.update);
  const [isSaving, setIsSaving] = useState(false);

  if (!preferences) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded w-1/3" />
          <div className="h-4 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded w-2/3" />
          <div className="space-y-3">
            <div className="h-10 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded" />
            <div className="h-10 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded" />
            <div className="h-10 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded" />
          </div>
        </div>
      </div>
    );
  }

  const handleToggle = async (field: string, value: boolean) => {
    setIsSaving(true);
    try {
      await updatePreferences({ [field]: value });
      toast.success("Preferences updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDigestChange = async (digest: "none" | "daily" | "weekly") => {
    setIsSaving(true);
    try {
      await updatePreferences({ emailDigest: digest });
      toast.success("Digest preference updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
          Notification Preferences
        </h1>
        <p className="mt-2 text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
          Control how and when you receive notifications from Cascade
        </p>
      </div>

      {/* Master Toggle */}
      <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-sm border border-ui-border-primary dark:border-ui-border-primary-dark p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
              Email Notifications
            </h3>
            <p className="mt-1 text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
              Master switch for all email notifications. Turn this off to stop receiving all emails.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={preferences.emailEnabled}
              onChange={(e) => handleToggle("emailEnabled", e.target.checked)}
              disabled={isSaving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-500/20 dark:peer-focus:ring-brand-500/40 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-ui-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-ui-border-primary-dark peer-checked:bg-brand-600" />
          </label>
        </div>
      </div>

      {/* Individual Notification Types */}
      <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-sm border border-ui-border-primary dark:border-ui-border-primary-dark p-6 mb-6">
        <h3 className="text-lg font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-4">
          Notification Types
        </h3>

        <div className="space-y-4">
          {/* Mentions */}
          <div className="flex items-start justify-between py-3 border-b border-ui-border-secondary dark:border-ui-border-secondary-dark last:border-0">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">@</span>
                <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">Mentions</h4>
              </div>
              <p className="mt-1 text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                When someone @mentions you in a comment or description
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={preferences.emailMentions}
                onChange={(e) => handleToggle("emailMentions", e.target.checked)}
                disabled={isSaving || !preferences.emailEnabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-500/20 dark:peer-focus:ring-brand-500/40 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-ui-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-ui-border-primary-dark peer-checked:bg-brand-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
            </label>
          </div>

          {/* Assignments */}
          <div className="flex items-start justify-between py-3 border-b border-ui-border-secondary dark:border-ui-border-secondary-dark last:border-0">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">Assignments</h4>
              </div>
              <p className="mt-1 text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                When you are assigned to an issue
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={preferences.emailAssignments}
                onChange={(e) => handleToggle("emailAssignments", e.target.checked)}
                disabled={isSaving || !preferences.emailEnabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-500/20 dark:peer-focus:ring-brand-500/40 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-ui-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-ui-border-primary-dark peer-checked:bg-brand-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
            </label>
          </div>

          {/* Comments */}
          <div className="flex items-start justify-between py-3 border-b border-ui-border-secondary dark:border-ui-border-secondary-dark last:border-0">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">Comments</h4>
              </div>
              <p className="mt-1 text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                When someone comments on your issues
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={preferences.emailComments}
                onChange={(e) => handleToggle("emailComments", e.target.checked)}
                disabled={isSaving || !preferences.emailEnabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-500/20 dark:peer-focus:ring-brand-500/40 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-ui-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-ui-border-primary-dark peer-checked:bg-brand-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
            </label>
          </div>

          {/* Status Changes */}
          <div className="flex items-start justify-between py-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔄</span>
                <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">Status Changes</h4>
              </div>
              <p className="mt-1 text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                When issue status changes on issues you're watching
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={preferences.emailStatusChanges}
                onChange={(e) => handleToggle("emailStatusChanges", e.target.checked)}
                disabled={isSaving || !preferences.emailEnabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-500/20 dark:peer-focus:ring-brand-500/40 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-ui-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-ui-border-primary-dark peer-checked:bg-brand-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
            </label>
          </div>
        </div>
      </div>

      {/* Digest Emails */}
      <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-sm border border-ui-border-primary dark:border-ui-border-primary-dark p-6">
        <h3 className="text-lg font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-2">Email Digests</h3>
        <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mb-4">
          Receive a summary of activity instead of individual emails
        </p>

        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-ui-border-primary dark:border-ui-border-primary-dark cursor-pointer hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark transition-colors">
            <input
              type="radio"
              name="digest"
              value="none"
              checked={preferences.emailDigest === "none"}
              onChange={() => handleDigestChange("none")}
              disabled={isSaving || !preferences.emailEnabled}
              className="w-4 h-4 text-brand-600 focus:ring-brand-500 focus:ring-2"
            />
            <div>
              <div className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">No digest</div>
              <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                Receive emails as events happen
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-ui-border-primary dark:border-ui-border-primary-dark cursor-pointer hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark transition-colors">
            <input
              type="radio"
              name="digest"
              value="daily"
              checked={preferences.emailDigest === "daily"}
              onChange={() => handleDigestChange("daily")}
              disabled={isSaving || !preferences.emailEnabled}
              className="w-4 h-4 text-brand-600 focus:ring-brand-500 focus:ring-2"
            />
            <div>
              <div className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">Daily digest</div>
              <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                One email per day with all activity (coming soon)
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-ui-border-primary dark:border-ui-border-primary-dark cursor-pointer hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark transition-colors">
            <input
              type="radio"
              name="digest"
              value="weekly"
              checked={preferences.emailDigest === "weekly"}
              onChange={() => handleDigestChange("weekly")}
              disabled={isSaving || !preferences.emailEnabled}
              className="w-4 h-4 text-brand-600 focus:ring-brand-500 focus:ring-2"
            />
            <div>
              <div className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">Weekly digest</div>
              <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                One email per week with all activity (coming soon)
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-brand-50 dark:bg-brand-950 rounded-lg border border-brand-200 dark:border-brand-800">
        <div className="flex gap-3">
          <span className="text-brand-600 dark:text-brand-400 text-xl">ℹ️</span>
          <div className="flex-1">
            <h4 className="font-medium text-brand-900 dark:text-brand-100 mb-1">
              Email Configuration
            </h4>
            <p className="text-sm text-brand-800 dark:text-brand-200">
              Email notifications require Resend API configuration. If you're not receiving emails,
              contact your administrator to set up email notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
