import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { CalendarView } from "./components/Calendar/CalendarView";
import { CommandPalette, useCommands } from "./components/CommandPalette";
import { Dashboard } from "./components/Dashboard";
import { DocumentEditor } from "./components/DocumentEditor";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GlobalSearch } from "./components/GlobalSearch";
import { KeyboardShortcutsHelp } from "./components/KeyboardShortcutsHelp";
import { NotificationCenter } from "./components/NotificationCenter";
import { OnboardingChecklist } from "./components/Onboarding/Checklist";
import { ProjectWizard } from "./components/Onboarding/ProjectWizard";
import { WelcomeTour } from "./components/Onboarding/WelcomeTour";
import { ProjectBoard } from "./components/ProjectBoard";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { SectionErrorFallback } from "./components/SectionErrorFallback";
import { Sidebar } from "./components/Sidebar";
import { ThemeToggle } from "./components/ThemeToggle";
import { TimerWidget } from "./components/TimeTracker/TimerWidget";
import { Timesheet } from "./components/TimeTracker/Timesheet";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
        <Toaster />
        <Content />
      </div>
    </ErrorBoundary>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [selectedDocumentId, setSelectedDocumentId] = useState<Id<"documents"> | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [activeView, setActiveView] = useState<
    "dashboard" | "documents" | "projects" | "timesheet" | "calendar"
  >("dashboard");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Onboarding state
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  const [showSampleProjectModal, setShowSampleProjectModal] = useState(false);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [showProjectWizard, setShowProjectWizard] = useState(false);
  const createSampleProject = useMutation(api.onboarding.createSampleProject);
  const _projects = useQuery(api.projects.list, {});

  // Check if user is new and should see onboarding
  useEffect(() => {
    if (loggedInUser && onboardingStatus !== undefined) {
      // If no onboarding record exists, this is a brand new user
      if (!onboardingStatus) {
        // Show sample project offer modal
        setShowSampleProjectModal(true);
      } else if (!onboardingStatus.tourShown && !showSampleProjectModal) {
        // Show welcome tour if they haven't seen it
        setShowWelcomeTour(true);
      }
    }
  }, [loggedInUser, onboardingStatus, showSampleProjectModal]);

  // Build commands for command palette
  const commands = useCommands({
    onNavigate: (view) => {
      setActiveView(view);
      if (view === "dashboard") {
        setSelectedDocumentId(null);
        setSelectedProjectId(null);
      }
    },
    onCreateIssue: undefined, // Will be set contextually
    onCreateDocument: undefined, // Will be set contextually
    onCreateProject: undefined, // Will be set contextually
  });

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "k",
      meta: true, // Cmd on Mac
      handler: () => setShowCommandPalette(true),
      description: "Open command palette",
    },
    {
      key: "k",
      ctrl: true, // Ctrl on Windows/Linux
      handler: () => setShowCommandPalette(true),
      description: "Open command palette",
    },
    {
      key: "d",
      meta: true,
      handler: () => {
        setActiveView("dashboard");
        setSelectedDocumentId(null);
        setSelectedProjectId(null);
      },
      description: "Go to dashboard",
    },
    {
      key: "1",
      meta: true,
      handler: () => setActiveView("dashboard"),
      description: "Go to dashboard",
    },
    {
      key: "2",
      meta: true,
      handler: () => setActiveView("documents"),
      description: "Go to documents",
    },
    {
      key: "3",
      meta: true,
      handler: () => setActiveView("projects"),
      description: "Go to projects",
    },
    {
      key: "4",
      meta: true,
      handler: () => setActiveView("timesheet"),
      description: "Go to timesheet",
    },
    {
      key: "5",
      meta: true,
      handler: () => setActiveView("calendar"),
      description: "Go to calendar",
    },
    {
      key: "?",
      shift: true,
      handler: () => setShowShortcutsHelp(true),
      description: "Show keyboard shortcuts",
    },
  ]);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Cascade! 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Would you like us to create a sample project with demo issues to help you explore
                Cascade?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const projectId = await createSampleProject();
                      setShowSampleProjectModal(false);
                      setShowWelcomeTour(true); // Start tour after creating sample project
                      toast.success("Sample project created! Let's take a quick tour.");
                      setActiveView("projects");
                      setSelectedProjectId(projectId as Id<"projects">);
                    } catch (_error) {
                      toast.error("Failed to create sample project");
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Yes, show me around!
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSampleProjectModal(false);
                    setShowProjectWizard(true); // Show project wizard instead
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  I'll start from scratch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Onboarding Checklist (sticky widget) */}
        <OnboardingChecklist />

        <div className="flex w-full min-h-screen">
          {/* Mobile Sidebar Backdrop */}
          {isMobileSidebarOpen && (
            <div
              role="button"
              tabIndex={0}
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsMobileSidebarOpen(false);
                }
              }}
              aria-label="Close sidebar"
            />
          )}

          {/* Sidebar - only show for documents and projects views */}
          {activeView !== "dashboard" &&
            activeView !== "timesheet" &&
            activeView !== "calendar" && (
              <ErrorBoundary
                fallback={
                  <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
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
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0 flex-1">
                {/* Mobile Hamburger Menu */}
                {activeView !== "dashboard" &&
                  activeView !== "timesheet" &&
                  activeView !== "calendar" && (
                    <button
                      type="button"
                      onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                      className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                  className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 overflow-x-auto"
                  aria-label="Main navigation"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView("dashboard");
                      setSelectedDocumentId(null);
                      setSelectedProjectId(null);
                    }}
                    className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      activeView === "dashboard"
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                    aria-label="Dashboard"
                    aria-current={activeView === "dashboard" ? "page" : undefined}
                  >
                    <span className="sm:hidden" aria-hidden="true">
                      🏠
                    </span>
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView("documents");
                      setSelectedProjectId(null);
                    }}
                    className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      activeView === "documents"
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                    aria-label="Documents"
                    aria-current={activeView === "documents" ? "page" : undefined}
                  >
                    <span className="sm:hidden" aria-hidden="true">
                      📄
                    </span>
                    <span className="hidden sm:inline">Documents</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView("projects");
                      setSelectedDocumentId(null);
                    }}
                    className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      activeView === "projects"
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                    aria-label="Projects"
                    aria-current={activeView === "projects" ? "page" : undefined}
                  >
                    <span className="sm:hidden" aria-hidden="true">
                      📋
                    </span>
                    <span className="hidden sm:inline">Projects</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView("timesheet");
                      setSelectedDocumentId(null);
                      setSelectedProjectId(null);
                    }}
                    className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      activeView === "timesheet"
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                    aria-label="Timesheet"
                    aria-current={activeView === "timesheet" ? "page" : undefined}
                  >
                    <span className="sm:hidden" aria-hidden="true">
                      ⏱️
                    </span>
                    <span className="hidden sm:inline">Timesheet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView("calendar");
                      setSelectedDocumentId(null);
                      setSelectedProjectId(null);
                    }}
                    className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      activeView === "calendar"
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                    aria-label="Calendar"
                    aria-current={activeView === "calendar" ? "page" : undefined}
                  >
                    <span className="sm:hidden" aria-hidden="true">
                      📅
                    </span>
                    <span className="hidden sm:inline">Calendar</span>
                  </button>
                </nav>

                <h1 className="hidden md:block text-base lg:text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                  {activeView === "dashboard"
                    ? "My Work"
                    : activeView === "documents"
                      ? selectedDocumentId
                        ? "Document Editor"
                        : "Select a document"
                      : activeView === "timesheet"
                        ? "Weekly Timesheet"
                        : activeView === "calendar"
                          ? "Calendar"
                          : selectedProjectId
                            ? "Project Board"
                            : "Select a project"}
                </h1>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCommandPalette(true)}
                  className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
                  <kbd className="hidden lg:inline px-1.5 py-0.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                    ⌘K
                  </kbd>
                </button>
                <button
                  type="button"
                  onClick={() => setShowShortcutsHelp(true)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                <GlobalSearch />
                <ThemeToggle />
                <NotificationCenter />
                <SignOutButton />
              </div>
            </header>

            {/* Main Content */}
            <main
              className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900"
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
                {activeView === "dashboard" ? (
                  <Dashboard
                    onNavigateToProject={(projectId) => {
                      setActiveView("projects");
                      setSelectedProjectId(projectId);
                    }}
                    onNavigateToProjects={() => setActiveView("projects")}
                  />
                ) : activeView === "documents" ? (
                  selectedDocumentId ? (
                    <DocumentEditor documentId={selectedDocumentId} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
                      <div className="text-center">
                        <h2 className="text-xl font-medium mb-2 text-gray-900 dark:text-gray-100">
                          Welcome to your workspace
                        </h2>
                        <p>
                          Select a document from the sidebar or create a new one to get started.
                        </p>
                      </div>
                    </div>
                  )
                ) : activeView === "timesheet" ? (
                  <Timesheet />
                ) : activeView === "calendar" ? (
                  <CalendarView />
                ) : selectedProjectId ? (
                  <ProjectBoard projectId={selectedProjectId} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
                    <div className="text-center">
                      <h2 className="text-xl font-medium mb-2 text-gray-900 dark:text-gray-100">
                        Welcome to project management
                      </h2>
                      <p>Select a project from the sidebar or create a new one to get started.</p>
                    </div>
                  </div>
                )}
              </ErrorBoundary>
            </main>
          </div>
        </div>

        {/* Global Timer Widget - always visible for authenticated users */}
        <TimerWidget />
      </Authenticated>

      <Unauthenticated>
        <div className="flex items-center justify-center w-full p-4">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Collaborative Workspace
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                Create documents and manage projects together in real-time
              </p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </>
  );
}
