import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "../../contexts/ThemeContext";
import { Card } from "../ui/Card";
import { Label } from "../ui/Label";
import {
  ShadcnSelect,
  ShadcnSelectContent,
  ShadcnSelectItem,
  ShadcnSelectTrigger,
  ShadcnSelectValue,
} from "../ui/ShadcnSelect";
import { Switch } from "../ui/Switch";
import { ToggleGroup, ToggleGroupItem } from "../ui/ToggleGroup";

/**
 * User preferences tab
 * Handles Theme, Timezone, and Browser Notifications (UI Settings)
 */
export function PreferencesTab() {
  const { theme, setTheme } = useTheme();

  // Settings from DB
  const userSettings = useQuery(api.userSettings.get);
  const updateSettings = useMutation(api.userSettings.update);

  // Local state for timezone (defaults to system if not set)
  const [selectedTimezone, setSelectedTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  useEffect(() => {
    if (userSettings?.timezone) {
      setSelectedTimezone(userSettings.timezone);
    }
    // Also sync theme from DB if different from local?
    // Usually theme context handles local storage, but we can respect DB as source of truth on load.
    if (userSettings?.theme && userSettings.theme !== theme) {
      // We won't force it here to avoid flickering loop, assuming user action drives it.
    }
  }, [userSettings]);

  const handleThemeChange = async (value: "light" | "dark" | "system") => {
    setTheme(value); // Update local context
    await updateSettings({ theme: value }); // Persist to DB
  };

  const handleTimezoneChange = async (value: string) => {
    setSelectedTimezone(value);
    try {
      await updateSettings({ timezone: value });
      toast.success("Timezone updated");
    } catch (_error) {
      toast.error("Failed to update timezone");
    }
  };

  const handleDesktopNotificationsChange = async (enabled: boolean) => {
    // In a real app, this would request browser permissions
    if (enabled && "Notification" in window && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Browser notifications blocked");
        return;
      }
    }

    await updateSettings({ desktopNotifications: enabled });
    toast.success(`Desktop notifications ${enabled ? "enabled" : "disabled"}`);
  };

  // Common timezones list (simplified)
  const timezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-4">
            Appearance
          </h3>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                  Theme
                </p>
                <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Select your preferred interface theme
                </p>
              </div>

              <ToggleGroup
                type="single"
                value={theme}
                onValueChange={(value) => {
                  if (value) handleThemeChange(value as "light" | "dark" | "system");
                }}
                variant="default"
                size="md"
              >
                <ToggleGroupItem value="light" aria-label="Light theme">
                  <span className="mr-2">☀️</span> Light
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" aria-label="Dark theme">
                  <span className="mr-2">🌙</span> Dark
                </ToggleGroupItem>
                <ToggleGroupItem value="system" aria-label="System theme">
                  <span className="mr-2">💻</span> System
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-4">
            Regional
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="timezone" className="text-base">
                Timezone
              </Label>
              <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1">
                Your timestamp display preference
              </p>
            </div>
            <div className="w-[240px]">
              <ShadcnSelect value={selectedTimezone} onValueChange={handleTimezoneChange}>
                <ShadcnSelectTrigger id="timezone">
                  <ShadcnSelectValue placeholder="Select timezone" />
                </ShadcnSelectTrigger>
                <ShadcnSelectContent>
                  {timezones.map((tz) => (
                    <ShadcnSelectItem key={tz} value={tz}>
                      {tz}
                    </ShadcnSelectItem>
                  ))}
                </ShadcnSelectContent>
              </ShadcnSelect>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-4">
            Desktop Notifications
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="desktop-notifs" className="text-base">
                Browser Push Notifications
              </Label>
              <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1">
                Receive pop-up notifications when you are active
              </p>
            </div>
            <Switch
              id="desktop-notifs"
              checked={userSettings?.desktopNotifications ?? false}
              onCheckedChange={handleDesktopNotificationsChange}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
