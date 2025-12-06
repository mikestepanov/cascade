import { api } from "@convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute("/_auth/_app/issues/$key")({
  component: IssuePage,
});

function IssuePage() {
  const { key } = Route.useParams(); // e.g., "PROJ-123"

  // Parse project key from issue key (e.g., "PROJ-123" -> "PROJ")
  const parts = key.split("-");
  const projectKey = parts.slice(0, -1).join("-"); // Handle keys like "ABC-DEF-123"

  const issue = useQuery(api.issues.getByKey, { key });

  if (issue === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (issue === null) {
    return (
      <div className="flex h-full items-center justify-center text-ui-text-tertiary">
        <div className="text-center">
          <Typography variant="h2" className="text-xl font-medium mb-2 border-none">
            Issue not found
          </Typography>
          <Typography variant="p" color="secondary">
            The issue "{key}" does not exist or you don't have access to it.
          </Typography>
          <Link
            to="/dashboard"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  // TODO: Create a proper IssueDetailPage component
  // For now, redirect to the project board where the issue can be viewed
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link
          to={`/projects/${projectKey}/board`}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          ← Back to {projectKey} board
        </Link>
      </div>
      <div className="bg-ui-bg-primary dark:bg-ui-bg-secondary-dark rounded-lg border border-ui-border-primary dark:border-ui-border-primary-dark p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-ui-text-secondary">{issue.key}</span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              issue.status === "done"
                ? "bg-status-success-bg text-status-success-text"
                : issue.status === "in-progress"
                  ? "bg-status-info-bg text-status-info-text"
                  : "bg-ui-bg-tertiary text-ui-text-secondary"
            }`}
          >
            {issue.status}
          </span>
        </div>
        <Typography variant="h1" className="text-2xl font-semibold mb-4">
          {issue.title}
        </Typography>
        {issue.description && (
          <div className="prose dark:prose-invert max-w-none">
            <Typography variant="p" color="secondary">
              {issue.description}
            </Typography>
          </div>
        )}
        <div className="mt-6 pt-4 border-t border-ui-border-primary dark:border-ui-border-primary-dark">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-ui-text-tertiary">Type:</span>
              <span className="ml-2 text-ui-text-primary capitalize">{issue.type}</span>
            </div>
            <div>
              <span className="text-ui-text-tertiary">Priority:</span>
              <span className="ml-2 text-ui-text-primary capitalize">{issue.priority}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
