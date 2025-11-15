import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { DocumentEditor } from "./components/DocumentEditor";
import { Sidebar } from "./components/Sidebar";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { ProjectBoard } from "./components/ProjectBoard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SectionErrorFallback } from "./components/SectionErrorFallback";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";

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
  const [activeView, setActiveView] = useState<"documents" | "projects">("documents");

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
        <div className="flex w-full h-screen">
          {/* Sidebar */}
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

          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-6">
                {/* View Switcher */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
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
                  {activeView === "documents"
                    ? selectedDocumentId
                      ? "Document Editor"
                      : "Select a document"
                    : selectedProjectId
                    ? "Project Board"
                    : "Select a project"}
                </h1>
              </div>
              <SignOutButton />
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
              <ErrorBoundary
                fallback={
                  <SectionErrorFallback
                    title="Content Error"
                    message="Failed to load this section. Please try selecting a different item."
                    onRetry={() => window.location.reload()}
                  />
                }
              >
                {activeView === "documents" ? (
                  selectedDocumentId ? (
                    <DocumentEditor documentId={selectedDocumentId} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <h2 className="text-xl font-medium mb-2">Welcome to your workspace</h2>
                        <p>Select a document from the sidebar or create a new one to get started.</p>
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
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Collaborative Workspace
              </h1>
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
