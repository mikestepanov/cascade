import { api } from "@convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { FileAttachments } from "@/components/FileAttachments";
import { IssueComments } from "@/components/IssueComments";
import { IssueDependencies } from "@/components/IssueDependencies";
import { IssueMetadataSection } from "@/components/IssueDetail/IssueMetadataSection";
import { SubtasksList } from "@/components/IssueDetail/SubtasksList";
import { IssueWatchers } from "@/components/IssueWatchers";
import { TimeTracker } from "@/components/TimeTracker";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { getTypeIcon } from "@/lib/issue-utils";

export const Route = createFileRoute("/_auth/_app/$orgSlug/issues/$key")({
  component: IssuePage,
});

function IssuePage() {
  const { orgSlug, key } = Route.useParams();
  const { billingEnabled } = useOrganization();

  // Query enriched issue data
  const issue = useQuery(api.issues.getByKey, { key });
  const subtasks = useQuery(api.issues.listSubtasks, issue ? { parentId: issue._id } : "skip");

  if (issue === undefined) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <LoadingSpinner size="lg" message="Loading issue details..." />
      </Flex>
    );
  }

  if (issue === null) {
    return (
      <Flex align="center" justify="center" className="h-full text-ui-text-tertiary">
        <div className="text-center">
          <Typography variant="h2" className="text-xl font-medium mb-2">
            Issue not found
          </Typography>
          <Typography variant="p" color="secondary">
            The issue "{key}" does not exist or you don't have access to it.
          </Typography>
          <Link
            to={ROUTES.dashboard.path}
            params={{ orgSlug }}
            className="mt-4 inline-block text-brand-600 hover:text-brand-700"
          >
            Back to dashboard
          </Link>
        </div>
      </Flex>
    );
  }

  // Parse project key from issue key for the back link
  const projectKey = key.split("-").slice(0, -1).join("-");

  return (
    <div className="p-6 max-w-5xl mx-auto pb-20">
      <div className="mb-6">
        <Link
          to={ROUTES.projects.board.path}
          params={{ orgSlug, key: projectKey }}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          ← Back to project board
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-ui-bg-primary rounded-xl border border-ui-border-primary p-6 shadow-sm">
            <Flex align="center" gap="sm" className="mb-4">
              <span className="text-xl">{getTypeIcon(issue.type)}</span>
              <Typography variant="small" color="secondary" className="font-mono">
                {issue.key}
              </Typography>
            </Flex>

            <Typography variant="h1" className="text-3xl font-bold mb-6 border-none">
              {issue.title}
            </Typography>

            <div className="space-y-4">
              <Typography
                variant="h3"
                className="text-sm font-semibold uppercase tracking-wider text-ui-text-tertiary border-none"
              >
                Description
              </Typography>
              <div className="prose dark:prose-invert max-w-none">
                {issue.description ? (
                  <Typography
                    variant="p"
                    color="secondary"
                    className="whitespace-pre-wrap leading-relaxed"
                  >
                    {issue.description}
                  </Typography>
                ) : (
                  <Typography variant="p" color="tertiary" className="italic">
                    No description provided.
                  </Typography>
                )}
              </div>
            </div>
          </div>

          {/* Sub-tasks */}
          {issue.type !== "subtask" && (
            <div className="bg-ui-bg-primary rounded-xl border border-ui-border-primary p-6 shadow-sm">
              <SubtasksList issueId={issue._id} projectId={issue.projectId} subtasks={subtasks} />
            </div>
          )}

          {/* Attachments */}
          <div className="bg-ui-bg-primary rounded-xl border border-ui-border-primary p-6 shadow-sm">
            <Typography variant="h3" className="text-lg font-semibold mb-4 border-none">
              Attachments
            </Typography>
            <FileAttachments issueId={issue._id} />
          </div>

          {/* Activity & Comments */}
          <div className="bg-ui-bg-primary rounded-xl border border-ui-border-primary p-6 shadow-sm">
            <Typography variant="h3" className="text-lg font-semibold mb-6 border-none">
              Discussion
            </Typography>
            <IssueComments issueId={issue._id} projectId={issue.projectId} />
          </div>
        </div>

        {/* Sidebar (Right) */}
        <div className="space-y-6">
          <div className="bg-ui-bg-primary rounded-xl border border-ui-border-primary p-6 shadow-sm">
            <Typography
              variant="h3"
              className="text-sm font-semibold uppercase tracking-wider text-ui-text-tertiary mb-6 border-none"
            >
              Details
            </Typography>
            <IssueMetadataSection
              status={issue.status}
              type={issue.type}
              assignee={issue.assignee}
              reporter={issue.reporter}
              storyPoints={issue.storyPoints}
              labels={issue.labels}
            />
          </div>

          {/* Time Tracking */}
          <div className="bg-ui-bg-primary rounded-xl border border-ui-border-primary p-6 shadow-sm">
            <Typography
              variant="h3"
              className="text-sm font-semibold uppercase tracking-wider text-ui-text-tertiary mb-4 border-none"
            >
              Time
            </Typography>
            <TimeTracker
              issueId={issue._id}
              projectId={issue.projectId}
              estimatedHours={issue.estimatedHours}
              billingEnabled={billingEnabled}
            />
          </div>

          {/* Dependencies */}
          <div className="bg-ui-bg-primary rounded-xl border border-ui-border-primary p-6 shadow-sm">
            <Typography
              variant="h3"
              className="text-sm font-semibold uppercase tracking-wider text-ui-text-tertiary mb-4 border-none"
            >
              Links
            </Typography>
            <IssueDependencies issueId={issue._id} projectId={issue.projectId} />
          </div>

          {/* Watchers */}
          <div className="bg-ui-bg-primary rounded-xl border border-ui-border-primary p-6 shadow-sm">
            <Typography
              variant="h3"
              className="text-sm font-semibold uppercase tracking-wider text-ui-text-tertiary mb-4 border-none"
            >
              Notifications
            </Typography>
            <IssueWatchers issueId={issue._id} />
          </div>
        </div>
      </div>
    </div>
  );
}
