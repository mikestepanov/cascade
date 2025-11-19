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
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Notification Preferences
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Control how and when you receive notifications from Cascade
        </p>
      </div>

      {/* Master Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Email Notifications
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary" />
          </label>
        </div>
      </div>

      {/* Individual Notification Types */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Notification Types
        </h3>

        <div className="space-y-4">
          {/* Mentions */}
          <div className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">@</span>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Mentions</h4>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
            </label>
          </div>

          {/* Assignments */}
          <div className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Assignments</h4>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
            </label>
          </div>

          {/* Comments */}
          <div className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Comments</h4>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
            </label>
          </div>

          {/* Status Changes */}
          <div className="flex items-start justify-between py-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔄</span>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Status Changes</h4>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
            </label>
          </div>
        </div>
      </div>

      {/* Digest Emails */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Email Digests</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Receive a summary of activity instead of individual emails
        </p>

        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <input
              type="radio"
              name="digest"
              value="none"
              checked={preferences.emailDigest === "none"}
              onChange={() => handleDigestChange("none")}
              disabled={isSaving || !preferences.emailEnabled}
              className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">No digest</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Receive emails as events happen
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <input
              type="radio"
              name="digest"
              value="daily"
              checked={preferences.emailDigest === "daily"}
              onChange={() => handleDigestChange("daily")}
              disabled={isSaving || !preferences.emailEnabled}
              className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Daily digest</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                One email per day with all activity (coming soon)
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <input
              type="radio"
              name="digest"
              value="weekly"
              checked={preferences.emailDigest === "weekly"}
              onChange={() => handleDigestChange("weekly")}
              disabled={isSaving || !preferences.emailEnabled}
              className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Weekly digest</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                One email per week with all activity (coming soon)
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <span className="text-blue-600 dark:text-blue-400 text-xl">ℹ️</span>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Email Configuration
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Email notifications require Resend API configuration. If you're not receiving emails,
              contact your administrator to set up email notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
