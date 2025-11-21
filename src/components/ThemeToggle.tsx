import { useTheme } from "../contexts/ThemeContext";

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
        <button
          type="button"
          key={t.value}
          onClick={() => setTheme(t.value)}
          aria-label={`Switch to ${t.label.toLowerCase()} theme`}
          className={`px-2 py-1 rounded-md text-sm transition-colors ${
            theme === t.value
              ? "bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark shadow-sm"
              : "text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark"
          }`}
          title={t.label}
        >
          <span className="text-base">{t.icon}</span>
        </button>
      ))}
    </div>
  );
}
