import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/Sidebar";

export const Route = createFileRoute("/_auth/_app/documents/")({
  component: DocumentsListPage,
});

function DocumentsListPage() {
  return (
    <div className="flex h-full">
      <Sidebar selectedDocumentId={null} />
      <div className="flex-1 flex items-center justify-center text-ui-text-tertiary dark:text-ui-text-tertiary-dark p-4">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2 text-ui-text-primary dark:text-ui-text-primary-dark">
            Welcome to your workspace
          </h2>
          <p>Select a document from the sidebar or create a new one to get started.</p>
        </div>
      </div>
    </div>
  );
}
