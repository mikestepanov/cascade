import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { lazy, Suspense } from "react";
import { Toaster, toast } from "sonner";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { AIAssistantButton, AIAssistantPanel } from "./components/AI";
import { AppHeader } from "./components/AppHeader";
import { UnifiedCalendarView } from "./components/Calendar/UnifiedCalendarView";
import { CommandPalette, useCommands } from "./components/CommandPalette";
import { Dashboard } from "./components/Dashboard";
import { useAppNavigation, useOnboardingState } from "./hooks/useAppState";

// Lazy load heavy components (not needed on initial render)
const DocumentEditor = lazy(() =>
  import("./components/DocumentEditor").then((m) => ({ default: m.DocumentEditor })),
);

// Lazy load Settings (only when user clicks settings)
const Settings = lazy(() => import("./components/Settings").then((m) => ({ default: m.Settings })));

// Lazy load Time Tracking (separate feature)
const TimeTrackingPage = lazy(() =>
  import("./components/TimeTracking/TimeTrackingPage").then((m) => ({
    default: m.TimeTrackingPage,
  })),
);

// Lazy load Onboarding components (only for new users)
const OnboardingTour = lazy(() =>
  import("./components/Onboarding/OnboardingTour").then((m) => ({ default: m.OnboardingTour })),
);
const ProjectWizard = lazy(() =>
  import("./components/Onboarding/ProjectWizard").then((m) => ({ default: m.ProjectWizard })),
);
const SampleProjectModal = lazy(() =>
  import("./components/Onboarding/SampleProjectModal").then((m) => ({
    default: m.SampleProjectModal,
  })),
);
const WelcomeModal = lazy(() =>
  import("./components/Onboarding/WelcomeModal").then((m) => ({ default: m.WelcomeModal })),
);
const WelcomeTour = lazy(() =>
  import("./components/Onboarding/WelcomeTour").then((m) => ({ default: m.WelcomeTour })),
);

import { EmailVerificationRequired } from "./components/auth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { KeyboardShortcutsHelp } from "./components/KeyboardShortcutsHelp";
import { NixeloLanding } from "./components/NixeloLanding";
import { OnboardingChecklist } from "./components/Onboarding/Checklist";
import { ProjectBoard } from "./components/ProjectBoard";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { SectionErrorFallback } from "./components/SectionErrorFallback";
import { Sidebar } from "./components/Sidebar";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { ModalBackdrop } from "./components/ui/ModalBackdrop";
import { createKeyboardShortcuts, createKeySequences } from "./config/keyboardShortcuts";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import { useKeyboardShortcutsWithSequences } from "./hooks/useKeyboardShortcuts";
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

// Helper component for onboarding modals
function OnboardingModals({
  showWelcomeTour,
  showProjectWizard,
  showSampleProjectModal,
  onWelcomeTourComplete,
  onProjectWizardComplete,
  onProjectWizardCancel,
  onSampleProjectCreate,
  onStartFromScratch,
}: {
  showWelcomeTour: boolean;
  showProjectWizard: boolean;
  showSampleProjectModal: boolean;
  onWelcomeTourComplete: () => void;
  onProjectWizardComplete: (projectId: Id<"projects">) => void;
  onProjectWizardCancel: () => void;
  onSampleProjectCreate: (projectId: Id<"projects">) => void;
  onStartFromScratch: () => void;
}) {
  return (
    <>
      {showWelcomeTour && (
        <WelcomeTour onComplete={onWelcomeTourComplete} onSkip={onWelcomeTourComplete} />
      )}
      {showProjectWizard && (
        <ProjectWizard onComplete={onProjectWizardComplete} onCancel={onProjectWizardCancel} />
      )}
      {showSampleProjectModal && (
        <SampleProjectModal
          onCreateSampleProject={onSampleProjectCreate}
          onStartFromScratch={onStartFromScratch}
        />
      )}
    </>
  );
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

  // Navigation state from custom hook
  const {
    selectedDocumentId,
    selectedProjectId,
    activeView,
    showCommandPalette,
    showShortcutsHelp,
    isMobileSidebarOpen,
    showAIAssistant,
    setSelectedDocumentId,
    setSelectedProjectId,
    setActiveView,
    setShowCommandPalette,
    setShowShortcutsHelp,
    setIsMobileSidebarOpen,
    setShowAIAssistant,
    clearSelections,
    handleNavigate,
  } = useAppNavigation();

  // AI suggestions for notification badge
  const aiSuggestions = useQuery(
    api.ai.queries.getProjectSuggestions,
    selectedProjectId ? { projectId: selectedProjectId } : "skip",
  );
  const unreadAISuggestions =
    aiSuggestions?.filter((s) => !(s.accepted || s.dismissed)).length || 0;

  // Onboarding state from custom hook
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  const {
    showSampleProjectModal,
    showWelcomeTour,
    showProjectWizard,
    setShowSampleProjectModal,
    setShowWelcomeTour,
    setShowProjectWizard,
  } = useOnboardingState(loggedInUser, onboardingStatus);

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

  // Check if user is authenticated but email not verified (password users only)
  // Google OAuth users are automatically verified
  const needsEmailVerification = loggedInUser?.email && !loggedInUser.emailVerificationTime;

  if (needsEmailVerification) {
    return <EmailVerificationRequired />;
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
        <OnboardingModals
          showWelcomeTour={showWelcomeTour}
          showProjectWizard={showProjectWizard}
          showSampleProjectModal={showSampleProjectModal}
          onWelcomeTourComplete={() => setShowWelcomeTour(false)}
          onProjectWizardComplete={(projectId) => {
            setShowProjectWizard(false);
            setActiveView("projects");
            setSelectedProjectId(projectId);
            toast.success("Project created successfully!");
          }}
          onProjectWizardCancel={() => setShowProjectWizard(false)}
          onSampleProjectCreate={(projectId) => {
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
            <AppHeader
              activeView={activeView}
              selectedDocumentId={selectedDocumentId}
              selectedProjectId={selectedProjectId}
              isMobileSidebarOpen={isMobileSidebarOpen}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              onViewChange={setActiveView}
              onShowCommandPalette={() => setShowCommandPalette(true)}
              onShowShortcutsHelp={() => setShowShortcutsHelp(true)}
              clearSelections={clearSelections}
            />

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
        <NixeloLanding />
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
