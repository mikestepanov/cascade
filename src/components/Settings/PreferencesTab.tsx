import { Card } from "../ui/Card";

/**
 * User preferences tab
 * Extracted from Settings for better organization
 */
export function PreferencesTab() {
  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-4">
          User Preferences
        </h3>
        <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
          Additional preference settings coming soon...
        </p>
      </div>
    </Card>
  );
}
