import { Card } from "../ui/Card";

/**
 * User preferences tab
 * Extracted from Settings for better organization
 */
export function PreferencesTab() {
  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          User Preferences
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Additional preference settings coming soon...
        </p>
      </div>
    </Card>
  );
}
