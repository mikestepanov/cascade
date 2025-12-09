import { createFileRoute } from "@tanstack/react-router";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute("/_auth/_app/$companySlug/documents/")({
  component: DocumentsListPage,
});

function DocumentsListPage() {
  return (
    <div className="flex-1 flex items-center justify-center text-ui-text-tertiary dark:text-ui-text-tertiary-dark p-4 h-full">
      <div className="text-center">
        <Typography variant="h2" className="text-xl font-medium mb-2">
          Welcome to your workspace
        </Typography>
        <Typography variant="p" color="tertiary">
          Select a document from the sidebar or create a new one to get started.
        </Typography>
      </div>
    </div>
  );
}
