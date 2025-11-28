import type { Id } from "../../convex/_generated/dataModel";
import { SignOutButton } from "../SignOutButton";
import { type AppView, shouldShowSidebar } from "../utils/viewHelpers";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationCenter } from "./NotificationCenter";
import { ThemeToggle } from "./ThemeToggle";
import { TimerWidget as NavTimerWidget } from "./TimeTracking/TimerWidget";

// Helper component for navigation buttons
function ViewSwitcherButton({
  view,
  activeView,
  onClick,
  icon,
  label,
}: {
  view: AppView;
  activeView: AppView;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  const isActive = activeView === view;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
        isActive
          ? "bg-ui-bg-primary dark:bg-ui-bg-tertiary-dark text-ui-text-primary dark:text-ui-text-primary-dark shadow-sm"
          : "text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark"
      }`}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="sm:hidden" aria-hidden="true">
        {icon}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// Helper function to get header title
function getHeaderTitle(
  activeView: AppView,
  selectedDocumentId: Id<"documents"> | null,
  selectedProjectId: Id<"projects"> | null,
): string {
  if (activeView === "dashboard") return "My Work";
  if (activeView === "timesheet") return "Weekly Timesheet";
  if (activeView === "calendar") return "Calendar";
  if (activeView === "settings") return "Settings";
  if (activeView === "documents") {
    return selectedDocumentId ? "Document Editor" : "Select a document";
  }
  return selectedProjectId ? "Project Board" : "Select a project";
}

interface AppHeaderProps {
  activeView: AppView;
  selectedDocumentId: Id<"documents"> | null;
  selectedProjectId: Id<"projects"> | null;
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  onViewChange: (view: AppView) => void;
  onShowCommandPalette: () => void;
  onShowShortcutsHelp: () => void;
  clearSelections: () => void;
}

export function AppHeader({
  activeView,
  selectedDocumentId,
  selectedProjectId,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  onViewChange,
  onShowCommandPalette,
  onShowShortcutsHelp,
  clearSelections,
}: AppHeaderProps) {
  return (
    <header className="bg-ui-bg-primary dark:bg-ui-bg-secondary-dark border-b border-ui-border-primary dark:border-ui-border-primary-dark px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2">
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0 flex-1">
        {/* Mobile Hamburger Menu */}
        {shouldShowSidebar(activeView) && (
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

        {/* View Switcher */}
        <nav
          className="flex bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded-lg p-1 overflow-x-auto"
          aria-label="Main navigation"
        >
          <ViewSwitcherButton
            view="dashboard"
            activeView={activeView}
            onClick={() => {
              onViewChange("dashboard");
              clearSelections();
            }}
            icon="🏠"
            label="Dashboard"
          />
          <ViewSwitcherButton
            view="documents"
            activeView={activeView}
            onClick={() => onViewChange("documents")}
            icon="📄"
            label="Documents"
          />
          <ViewSwitcherButton
            view="projects"
            activeView={activeView}
            onClick={() => onViewChange("projects")}
            icon="📋"
            label="Projects"
          />
          <ViewSwitcherButton
            view="timesheet"
            activeView={activeView}
            onClick={() => {
              onViewChange("timesheet");
              clearSelections();
            }}
            icon="⏱️"
            label="Timesheet"
          />
          <ViewSwitcherButton
            view="calendar"
            activeView={activeView}
            onClick={() => {
              onViewChange("calendar");
              clearSelections();
            }}
            icon="📅"
            label="Calendar"
          />
          <ViewSwitcherButton
            view="settings"
            activeView={activeView}
            onClick={() => {
              onViewChange("settings");
              clearSelections();
            }}
            icon="⚙️"
            label="Settings"
          />
        </nav>

        <h1 className="hidden md:block text-base lg:text-lg font-medium text-ui-text-primary dark:text-ui-text-primary-dark truncate">
          {getHeaderTitle(activeView, selectedDocumentId, selectedProjectId)}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
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

        <NavTimerWidget />
        <GlobalSearch />
        <ThemeToggle />
        <NotificationCenter />
        <SignOutButton />
      </div>
    </header>
  );
}
