import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "../ui/Card";
import { Switch } from "../ui/Switch";
import { Typography } from "../ui/Typography";

export function NotificationsTab() {
  const preferences = useQuery(api.notificationPreferences.get);
  const updatePreferences = useMutation(api.notificationPreferences.update);
  const [isSaving, setIsSaving] = useState(false);

  if (!preferences) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-ui-bg-tertiary rounded w-1/3" />
            <div className="h-4 bg-ui-bg-tertiary rounded w-2/3" />
            <div className="space-y-3">
              <div className="h-10 bg-ui-bg-tertiary rounded" />
              <div className="h-10 bg-ui-bg-tertiary rounded" />
              <div className="h-10 bg-ui-bg-tertiary rounded" />
            </div>
          </div>
        </div>
      </Card>
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
    <div className="space-y-6">
      {/* Master Toggle */}
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Typography variant="h3">Email Notifications</Typography>
              <Typography variant="p" color="secondary" className="mt-1 text-sm">
                Master switch for all email notifications. Turn this off to stop receiving all
                emails.
              </Typography>
            </div>
            <Switch
              checked={preferences.emailEnabled}
              onCheckedChange={(value) => handleToggle("emailEnabled", value)}
              disabled={isSaving}
              className="ml-4"
            />
          </div>
        </div>
      </Card>

      {/* Individual Notification Types */}
      <Card>
        <div className="p-6">
          <Typography variant="h3" className="mb-4">
            Notification Types
          </Typography>

          <div className="space-y-4">
            {/* Mentions */}
            <div className="flex items-start justify-between py-3 border-b border-ui-border-secondary last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">@</span>
                  <Typography variant="h4" className="font-medium text-base">
                    Mentions
                  </Typography>
                </div>
                <Typography variant="p" color="secondary" className="mt-1 text-sm">
                  When someone @mentions you in a comment or description
                </Typography>
              </div>
              <Switch
                checked={preferences.emailMentions}
                onCheckedChange={(value) => handleToggle("emailMentions", value)}
                disabled={isSaving || !preferences.emailEnabled}
                className="ml-4"
              />
            </div>

            {/* Assignments */}
            <div className="flex items-start justify-between py-3 border-b border-ui-border-secondary last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👤</span>
                  <Typography variant="h4" className="font-medium text-base">
                    Assignments
                  </Typography>
                </div>
                <Typography variant="p" color="secondary" className="mt-1 text-sm">
                  When you are assigned to an issue
                </Typography>
              </div>
              <Switch
                checked={preferences.emailAssignments}
                onCheckedChange={(value) => handleToggle("emailAssignments", value)}
                disabled={isSaving || !preferences.emailEnabled}
                className="ml-4"
              />
            </div>

            {/* Comments */}
            <div className="flex items-start justify-between py-3 border-b border-ui-border-secondary last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💬</span>
                  <Typography variant="h4" className="font-medium text-base">
                    Comments
                  </Typography>
                </div>
                <Typography variant="p" color="secondary" className="mt-1 text-sm">
                  When someone comments on your issues
                </Typography>
              </div>
              <Switch
                checked={preferences.emailComments}
                onCheckedChange={(value) => handleToggle("emailComments", value)}
                disabled={isSaving || !preferences.emailEnabled}
                className="ml-4"
              />
            </div>

            {/* Status Changes */}
            <div className="flex items-start justify-between py-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔄</span>
                  <Typography variant="h4" className="font-medium text-base">
                    Status Changes
                  </Typography>
                </div>
                <Typography variant="p" color="secondary" className="mt-1 text-sm">
                  When issue status changes on issues you're watching
                </Typography>
              </div>
              <Switch
                checked={preferences.emailStatusChanges}
                onCheckedChange={(value) => handleToggle("emailStatusChanges", value)}
                disabled={isSaving || !preferences.emailEnabled}
                className="ml-4"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Digest Emails */}
      <Card>
        <div className="p-6">
          <Typography variant="h3" className="mb-2">
            Email Digests
          </Typography>
          <Typography variant="p" color="secondary" className="mb-4 text-sm">
            Receive a summary of activity instead of individual emails
          </Typography>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-ui-border-primary cursor-pointer hover:bg-ui-bg-secondary transition-colors">
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
                <div className="font-medium text-ui-text-primary">No digest</div>
                <div className="text-sm text-ui-text-secondary">
                  Receive emails as events happen
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-ui-border-primary cursor-pointer hover:bg-ui-bg-secondary transition-colors">
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
                <div className="font-medium text-ui-text-primary">Daily digest</div>
                <div className="text-sm text-ui-text-secondary">
                  One email per day with all activity (coming soon)
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-ui-border-primary cursor-pointer hover:bg-ui-bg-secondary transition-colors">
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
                <div className="font-medium text-ui-text-primary">Weekly digest</div>
                <div className="text-sm text-ui-text-secondary">
                  One email per week with all activity (coming soon)
                </div>
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-brand-50 dark:bg-brand-950 rounded-lg border border-brand-200 dark:border-brand-800">
        <div className="flex gap-3">
          <span className="text-brand-600 dark:text-brand-400 text-xl">ℹ️</span>
          <div className="flex-1">
            <Typography
              variant="h4"
              className="font-medium text-brand-900 dark:text-brand-100 mb-1"
            >
              Email Configuration
            </Typography>
            <Typography variant="p" className="text-sm text-brand-800 dark:text-brand-200">
              Email notifications require Resend API configuration. If you're not receiving emails,
              contact your administrator to set up email notifications.
            </Typography>
          </div>
        </div>
      </div>
    </div>
  );
}
