import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { AIAssistantButton, AIAssistantPanel } from "./components/AI";
import { UnifiedCalendarView } from "./components/Calendar/UnifiedCalendarView";
import { CommandPalette, useCommands } from "./components/CommandPalette";
import { Dashboard } from "./components/Dashboard";

// Lazy load heavy BlockNote editor (~400-500 KB)
const DocumentEditor = lazy(() =>
  import("./components/DocumentEditor").then((m) => ({ default: m.DocumentEditor })),
);

import { ErrorBoundary } from "./components/ErrorBoundary";
import { GlobalSearch } from "./components/GlobalSearch";
import { KeyboardShortcutsHelp } from "./components/KeyboardShortcutsHelp";
import { NotificationCenter } from "./components/NotificationCenter";
import { OnboardingChecklist } from "./components/Onboarding/Checklist";
import { OnboardingTour } from "./components/Onboarding/OnboardingTour";
import { ProjectWizard } from "./components/Onboarding/ProjectWizard";
import { SampleProjectModal } from "./components/Onboarding/SampleProjectModal";
import { WelcomeModal } from "./components/Onboarding/WelcomeModal";
import { WelcomeTour } from "./components/Onboarding/WelcomeTour";
import { ProjectBoard } from "./components/ProjectBoard";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { SectionErrorFallback } from "./components/SectionErrorFallback";
import { Settings } from "./components/Settings";
import { Sidebar } from "./components/Sidebar";
import { ThemeToggle } from "./components/ThemeToggle";
import { TimerWidget as NavTimerWidget } from "./components/TimeTracking/TimerWidget";
import { TimeTrackingPage } from "./components/TimeTracking/TimeTrackingPage";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { ModalBackdrop } from "./components/ui/ModalBackdrop";
import { createKeyboardShortcuts, createKeySequences } from "./config/keyboardShortcuts";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import { useKeyboardShortcutsWithSequences } from "./hooks/useKeyboardShortcuts";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { type AppView, shouldShowSidebar } from "./utils/viewHelpers";

export default function App() {
  return (
    <ErrorBoundary>
      <OnboardingProvider>
        <div className="min-h-screen flex bg-ui-bg-secondary dark:bg-ui-bg-primary-dark">
          <Toaster />
          <Content />
        </div>
      </OnboardingProvider>
    </ErrorBoundary>
  );
}

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

// Helper component for main content area
function MainContentView({
  activeView,
  selectedDocumentId,
  selectedProjectId,
  onNavigateToProject,
  onNavigateToProjects,
}: {
  activeView: AppView;
  selectedDocumentId: Id<"documents"> | null;
  selectedProjectId: Id<"projects"> | null;
  onNavigateToProject: (projectId: Id<"projects">) => void;
  onNavigateToProjects: () => void;
}) {
  if (activeView === "dashboard") {
    return (
      <Dashboard
        onNavigateToProject={onNavigateToProject}
        onNavigateToProjects={onNavigateToProjects}
      />
    );
  }

  if (activeView === "documents") {
    if (selectedDocumentId) {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <DocumentEditor documentId={selectedDocumentId} />
        </Suspense>
      );
    }
    return (
      <div className="flex items-center justify-center h-full text-ui-text-tertiary dark:text-ui-text-tertiary-dark p-4">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2 text-ui-text-primary dark:text-ui-text-primary-dark">
            Welcome to your workspace
          </h2>
          <p>Select a document from the sidebar or create a new one to get started.</p>
        </div>
      </div>
    );
  }

  if (activeView === "timesheet") {
    return <TimeTrackingPage />;
  }

  if (activeView === "calendar") {
    return <UnifiedCalendarView projectId={selectedProjectId || undefined} />;
  }

  if (activeView === "settings") {
    return <Settings />;
  }

  // Projects view
  if (selectedProjectId) {
    return <ProjectBoard projectId={selectedProjectId} />;
  }

  return (
    <div className="flex items-center justify-center h-full text-ui-text-tertiary dark:text-ui-text-tertiary-dark p-4">
      <div className="text-center">
        <h2 className="text-xl font-medium mb-2 text-ui-text-primary dark:text-ui-text-primary-dark">
          Welcome to project management
        </h2>
        <p>Select a project from the sidebar or create a new one to get started.</p>
      </div>
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [selectedDocumentId, setSelectedDocumentId] = useState<Id<"documents"> | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // AI suggestions for notification badge
  const aiSuggestions = useQuery(
    api.ai.queries.getProjectSuggestions,
    selectedProjectId ? { projectId: selectedProjectId } : "skip",
  );
  const unreadAISuggestions =
    aiSuggestions?.filter((s) => !(s.accepted || s.dismissed)).length || 0;

  // Onboarding state
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  const [showSampleProjectModal, setShowSampleProjectModal] = useState(false);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [showProjectWizard, setShowProjectWizard] = useState(false);

  // Check if user is new and should see onboarding
  useEffect(() => {
    if (!loggedInUser || onboardingStatus === undefined) return;

    // If no onboarding record exists, this is a brand new user
    if (!onboardingStatus) {
      setShowSampleProjectModal(true);
      return;
    }

    // Show welcome tour if they haven't seen it
    if (!(onboardingStatus.tourShown || showSampleProjectModal)) {
      setShowWelcomeTour(true);
    }
  }, [loggedInUser, onboardingStatus, showSampleProjectModal]);

  const clearSelections = () => {
    setSelectedDocumentId(null);
    setSelectedProjectId(null);
  };

  const handleNavigate = (view: AppView) => {
    setActiveView(view);
    if (view === "dashboard") {
      clearSelections();
    }
  };

  // Build commands for command palette
  const commands = useCommands({
    onNavigate: handleNavigate,
    onCreateIssue: undefined,
    onCreateDocument: undefined,
    onCreateProject: undefined,
  });

  // Create keyboard shortcuts with handlers
  const shortcuts = createKeyboardShortcuts({
    setActiveView,
    setShowCommandPalette,
    setShowShortcutsHelp,
    setShowAIAssistant: (toggle) => setShowAIAssistant(toggle),
    clearSelections,
  });

  const sequences = createKeySequences({
    setActiveView,
    setShowCommandPalette,
    setShowShortcutsHelp,
    setShowAIAssistant: (toggle) => setShowAIAssistant(toggle),
    clearSelections,
  });

  // Register shortcuts with sequence support
  useKeyboardShortcutsWithSequences(shortcuts, sequences);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ui-text-primary dark:border-ui-text-primary-dark" />
      </div>
    );
  }

  return (
    <>
      <Authenticated>
        {/* Command Palette */}
        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          commands={commands}
        />

        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcutsHelp
          isOpen={showShortcutsHelp}
          onClose={() => setShowShortcutsHelp(false)}
        />

        {/* Onboarding Components */}
        {showWelcomeTour && (
          <WelcomeTour
            onComplete={() => setShowWelcomeTour(false)}
            onSkip={() => setShowWelcomeTour(false)}
          />
        )}

        {showProjectWizard && (
          <ProjectWizard
            onComplete={(projectId) => {
              setShowProjectWizard(false);
              setActiveView("projects");
              setSelectedProjectId(projectId as Id<"projects">);
              toast.success("Project created successfully!");
            }}
            onCancel={() => setShowProjectWizard(false)}
          />
        )}

        {/* Sample Project Offer Modal */}
        {showSampleProjectModal && (
          <SampleProjectModal
            onCreateSampleProject={(projectId) => {
              setShowSampleProjectModal(false);
              setShowWelcomeTour(true);
              setActiveView("projects");
              setSelectedProjectId(projectId);
            }}
            onStartFromScratch={() => {
              setShowSampleProjectModal(false);
              setShowProjectWizard(true);
            }}
          />
        )}

        {/* Onboarding Checklist (sticky widget) */}
        <OnboardingChecklist />

        <div className="flex w-full min-h-screen">
          {/* Mobile Sidebar Backdrop */}
          {isMobileSidebarOpen && (
            <ModalBackdrop
              onClick={() => setIsMobileSidebarOpen(false)}
              zIndex="z-30"
              className="lg:hidden"
              animated={false}
            />
          )}

          {/* Sidebar - only show for documents and projects views */}
          {shouldShowSidebar(activeView) && (
            <ErrorBoundary
              fallback={
                <div className="w-64 bg-ui-bg-primary dark:bg-ui-bg-secondary-dark border-r border-ui-border-primary dark:border-ui-border-primary-dark">
                  <SectionErrorFallback
                    title="Sidebar Error"
                    message="Failed to load sidebar. Please refresh the page."
                  />
                </div>
              }
            >
              <div
                data-tour={activeView === "documents" ? "sidebar" : ""}
                className={`
                    fixed lg:relative inset-y-0 left-0 z-40 lg:z-auto
                    transform transition-transform duration-200 ease-in-out
                    ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                  `}
              >
                {activeView === "documents" ? (
                  <Sidebar
                    selectedDocumentId={selectedDocumentId}
                    onSelectDocument={(id) => {
                      setSelectedDocumentId(id);
                      setIsMobileSidebarOpen(false);
                    }}
                  />
                ) : (
                  <ProjectSidebar
                    selectedProjectId={selectedProjectId}
                    onSelectProject={(id) => {
                      setSelectedProjectId(id);
                      setIsMobileSidebarOpen(false);
                    }}
                  />
                )}
              </div>
            </ErrorBoundary>
          )}

          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <header className="bg-ui-bg-primary dark:bg-ui-bg-secondary-dark border-b border-ui-border-primary dark:border-ui-border-primary-dark px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0 flex-1">
                {/* Mobile Hamburger Menu */}
                {shouldShowSidebar(activeView) && (
                  <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    className="lg:hidden p-2 text-ui-text-secondary dark:text-ui-text-tertiary-dark hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark rounded-lg transition-colors"
                    aria-label="Toggle sidebar menu"
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
                      setActiveView("dashboard");
                      clearSelections();
                    }}
                    icon="🏠"
                    label="Dashboard"
                  />
                  <ViewSwitcherButton
                    view="documents"
                    activeView={activeView}
                    onClick={() => {
                      setActiveView("documents");
                      setSelectedProjectId(null);
                    }}
                    icon="📄"
                    label="Documents"
                  />
                  <ViewSwitcherButton
                    view="projects"
                    activeView={activeView}
                    onClick={() => {
                      setActiveView("projects");
                      setSelectedDocumentId(null);
                    }}
                    icon="📋"
                    label="Projects"
                  />
                  <ViewSwitcherButton
                    view="timesheet"
                    activeView={activeView}
                    onClick={() => {
                      setActiveView("timesheet");
                      clearSelections();
                    }}
                    icon="⏱️"
                    label="Timesheet"
                  />
                  <ViewSwitcherButton
                    view="calendar"
                    activeView={activeView}
                    onClick={() => {
                      setActiveView("calendar");
                      clearSelections();
                    }}
                    icon="📅"
                    label="Calendar"
                  />
                  <ViewSwitcherButton
                    view="settings"
                    activeView={activeView}
                    onClick={() => {
                      setActiveView("settings");
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
                  onClick={() => setShowCommandPalette(true)}
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
                  onClick={() => setShowShortcutsHelp(true)}
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

            {/* Main Content */}
            <main
              className="flex-1 overflow-auto bg-ui-bg-secondary dark:bg-ui-bg-primary-dark"
              data-tour={activeView === "dashboard" ? "dashboard" : ""}
            >
              <ErrorBoundary
                fallback={
                  <SectionErrorFallback
                    title="Content Error"
                    message="Failed to load this section. Please try selecting a different item."
                    onRetry={() => window.location.reload()}
                  />
                }
              >
                <MainContentView
                  activeView={activeView}
                  selectedDocumentId={selectedDocumentId}
                  selectedProjectId={selectedProjectId}
                  onNavigateToProject={(projectId) => {
                    setActiveView("projects");
                    setSelectedProjectId(projectId);
                  }}
                  onNavigateToProjects={() => setActiveView("projects")}
                />
              </ErrorBoundary>
            </main>
          </div>
        </div>

        {/* Global Timer Widget - always visible for authenticated users */}
        <NavTimerWidget />

        {/* AI Assistant Panel */}
        <AIAssistantPanel
          projectId={selectedProjectId || undefined}
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
        />

        {/* AI Assistant Floating Button */}
        {!showAIAssistant && (
          <AIAssistantButton
            onClick={() => setShowAIAssistant(true)}
            unreadCount={unreadAISuggestions}
          />
        )}
      </Authenticated>

      <Unauthenticated>
        <div className="flex items-center justify-center w-full p-4">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mb-4">
                Collaborative Workspace
              </h1>
              <p className="text-base sm:text-lg text-ui-text-secondary dark:text-ui-text-tertiary-dark">
                Create documents and manage projects together in real-time
              </p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      {/* Onboarding Modals */}
      <WelcomeModal
        onNavigateToProject={(projectId) => {
          setActiveView("projects");
          setSelectedProjectId(projectId);
        }}
      />
      <OnboardingTour />
    </>
  );
}
