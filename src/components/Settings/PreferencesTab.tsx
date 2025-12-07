import { useTheme } from "../../contexts/ThemeContext";
import { Card } from "../ui/Card";
import { ToggleGroup, ToggleGroupItem } from "../ui/ToggleGroup";

/**
 * User preferences tab
 * Extracted from Settings for better organization
 */
export function PreferencesTab() {
  const { theme, setTheme } = useTheme();

  return (
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
                if (value) setTheme(value as "light" | "dark" | "system");
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
  );
}
