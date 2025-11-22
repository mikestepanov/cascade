import { useTheme } from "../contexts/ThemeContext";
import { Button } from "./ui/Button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes: Array<{ value: "light" | "dark" | "system"; icon: string; label: string }> = [
    { value: "light", icon: "☀️", label: "Light" },
    { value: "dark", icon: "🌙", label: "Dark" },
    { value: "system", icon: "💻", label: "System" },
  ];

  return (
    <div className="flex items-center gap-1 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded-lg p-1">
      {themes.map((t) => (
        <Button
          key={t.value}
          variant={theme === t.value ? "primary" : "ghost"}
          size="sm"
          onClick={() => setTheme(t.value)}
          aria-label={`Switch to ${t.label.toLowerCase()} theme`}
          title={t.label}
          className={theme === t.value ? "shadow-sm" : ""}
        >
          <span className="text-base">{t.icon}</span>
        </Button>
      ))}
    </div>
  );
}
