import { Link, useLocation } from "@tanstack/react-router";
import { SignOutButton } from "../SignOutButton";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationCenter } from "./NotificationCenter";
import { TimerWidget as NavTimerWidget } from "./TimeTracking/TimerWidget";

// Navigation item configuration
const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/documents", label: "Documents", icon: "📄" },
  { to: "/projects", label: "Projects", icon: "📋" },
] as const;

interface AppHeaderProps {
  isMobileSidebarOpen?: boolean;
  onToggleMobileSidebar?: () => void;
  onShowCommandPalette?: () => void;
  onShowShortcutsHelp?: () => void;
}

export function AppHeader({
  isMobileSidebarOpen = false,
  onToggleMobileSidebar,
  onShowCommandPalette,
  onShowShortcutsHelp,
}: AppHeaderProps) {
  const location = useLocation();

  // Check if current path matches or starts with a nav item path
  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-ui-bg-primary dark:bg-ui-bg-secondary-dark border-b border-ui-border-primary dark:border-ui-border-primary-dark px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2">
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0 flex-1">
        {/* Mobile Hamburger Menu */}
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-ui-text-secondary dark:text-ui-text-tertiary-dark hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark rounded-lg transition-colors"
            aria-label="Toggle sidebar menu"
            aria-expanded={isMobileSidebarOpen}
          >
            <svg
              aria-hidden="true"
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}

        {/* View Switcher - Using TanStack Router Link */}
        <nav
          className="flex bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded-lg p-1 overflow-x-auto"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-ui-bg-primary dark:bg-ui-bg-tertiary-dark text-ui-text-primary dark:text-ui-text-primary-dark shadow-sm"
                    : "text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className="sm:hidden" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {onShowCommandPalette && (
          <button
            type="button"
            onClick={onShowCommandPalette}
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-ui-text-secondary dark:text-ui-text-tertiary-dark bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded-lg hover:bg-ui-border-primary dark:hover:bg-ui-border-secondary-dark transition-colors"
            aria-label="Open command palette"
            data-tour="command-palette"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="hidden sm:inline">Commands</span>
            <kbd className="hidden lg:inline px-1.5 py-0.5 text-xs bg-ui-bg-primary dark:bg-ui-bg-secondary-dark border border-ui-border-secondary dark:border-ui-border-secondary-dark rounded">
              ⌘K
            </kbd>
          </button>
        )}

        {onShowShortcutsHelp && (
          <button
            type="button"
            onClick={onShowShortcutsHelp}
            className="p-2 text-ui-text-secondary dark:text-ui-text-tertiary-dark hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark rounded-lg transition-colors"
            aria-label="Keyboard shortcuts"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        )}

        <NavTimerWidget />
        <GlobalSearch />
        <NotificationCenter />
        <SignOutButton />
      </div>
    </header>
  );
}
