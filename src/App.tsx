import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { useState } from "react";
import { Toaster } from "sonner";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { CommandPalette, useCommands } from "./components/CommandPalette";
import { Dashboard } from "./components/Dashboard";
import { DocumentEditor } from "./components/DocumentEditor";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GlobalSearch } from "./components/GlobalSearch";
import { KeyboardShortcutsHelp } from "./components/KeyboardShortcutsHelp";
import { NotificationCenter } from "./components/NotificationCenter";
import { ProjectBoard } from "./components/ProjectBoard";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { SectionErrorFallback } from "./components/SectionErrorFallback";
import { Sidebar } from "./components/Sidebar";
import { ThemeToggle } from "./components/ThemeToggle";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex bg-gray-50">
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
  const [activeView, setActiveView] = useState<"dashboard" | "documents" | "projects">("dashboard");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

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

        <div className="flex w-full h-screen">
          {/* Sidebar - only show for documents and projects views */}
          {activeView !== "dashboard" && (
            <ErrorBoundary
              fallback={
                <div className="w-64 bg-white border-r border-gray-200">
                  <SectionErrorFallback
                    title="Sidebar Error"
                    message="Failed to load sidebar. Please refresh the page."
                  />
                </div>
              }
            >
              {activeView === "documents" ? (
                <Sidebar
                  selectedDocumentId={selectedDocumentId}
                  onSelectDocument={setSelectedDocumentId}
                />
              ) : (
                <ProjectSidebar
                  selectedProjectId={selectedProjectId}
                  onSelectProject={setSelectedProjectId}
                />
              )}
            </ErrorBoundary>
          )}

          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-6">
                {/* View Switcher */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView("dashboard");
                      setSelectedDocumentId(null);
                      setSelectedProjectId(null);
                    }}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      activeView === "dashboard"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    🏠 Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView("documents");
                      setSelectedProjectId(null);
                    }}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      activeView === "documents"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    📄 Documents
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView("projects");
                      setSelectedDocumentId(null);
                    }}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      activeView === "projects"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    📋 Projects
                  </button>
                </div>

                <h1 className="text-lg font-medium text-gray-900">
                  {activeView === "dashboard"
                    ? "My Work"
                    : activeView === "documents"
                      ? selectedDocumentId
                        ? "Document Editor"
                        : "Select a document"
                      : selectedProjectId
                        ? "Project Board"
                        : "Select a project"}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCommandPalette(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Open command palette"
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
                  <kbd className="hidden md:inline px-1.5 py-0.5 text-xs bg-white border border-gray-300 rounded">
                    ⌘K
                  </kbd>
                </button>
                <button
                  type="button"
                  onClick={() => setShowShortcutsHelp(true)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Keyboard shortcuts"
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
            <main className="flex-1 overflow-auto">
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
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <h2 className="text-xl font-medium mb-2">Welcome to your workspace</h2>
                        <p>
                          Select a document from the sidebar or create a new one to get started.
                        </p>
                      </div>
                    </div>
                  )
                ) : selectedProjectId ? (
                  <ProjectBoard projectId={selectedProjectId} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <h2 className="text-xl font-medium mb-2">Welcome to project management</h2>
                      <p>Select a project from the sidebar or create a new one to get started.</p>
                    </div>
                  </div>
                )}
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </Authenticated>

      <Unauthenticated>
        <div className="flex items-center justify-center w-full">
          <div className="w-full max-w-md mx-auto p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Collaborative Workspace</h1>
              <p className="text-lg text-gray-600">
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
