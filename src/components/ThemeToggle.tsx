import { useTheme } from "../contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes: Array<{ value: "light" | "dark" | "system"; icon: string; label: string }> = [
    { value: "light", icon: "☀️", label: "Light" },
    { value: "dark", icon: "🌙", label: "Dark" },
    { value: "system", icon: "💻", label: "System" },
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {themes.map((t) => (
        <button
          type="button"
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={`px-2 py-1 rounded-md text-sm transition-colors ${
            theme === t.value
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
          title={t.label}
        >
          <span className="text-base">{t.icon}</span>
        </button>
      ))}
    </div>
  );
}
