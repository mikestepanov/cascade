import { api } from "@convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { FileAttachments } from "@/components/FileAttachments";
import { IssueComments } from "@/components/IssueComments";
import { IssueDependencies } from "@/components/IssueDependencies";
import { IssueMetadataSection } from "@/components/IssueDetail/IssueMetadataSection";
import { SubtasksList } from "@/components/IssueDetail/SubtasksList";
import { IssueWatchers } from "@/components/IssueWatchers";
import { TimeTracker } from "@/components/TimeTracker";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/Textarea";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { Check, ChevronLeft, Copy } from "@/lib/icons";
import { getTypeIcon } from "@/lib/issue-utils";
import { showError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_auth/_app/$orgSlug/issues/$key")({
  component: IssuePage,
});

function IssuePage() {
  const { orgSlug, key } = Route.useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hasCopied, setHasCopied] = useState(false);

  const { billingEnabled } = useOrganization();

  // Parse project key from issue key (e.g., "PROJ-123" -> "PROJ")
  const parts = key.split("-");
  const projectKey = parts.slice(0, -1).join("-");

  // Query enriched issue data
  const issue = useQuery(api.issues.getByKey, { key });
  const subtasks = useQuery(api.issues.listSubtasks, issue ? { parentId: issue._id } : "skip");
  const updateIssue = useMutation(api.issues.update);

  useEffect(() => {
    if (issue) {
      setTitle(issue.title);
      setDescription(issue.description || "");
    }
  }, [issue]);

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
          <Button asChild variant="outline" className="mt-4">
            <Link to={ROUTES.dashboard.path} params={{ orgSlug }}>
              Back to dashboard
            </Link>
          </Button>
        </div>
      </Flex>
    );
  }

  const handleSave = async () => {
    try {
      await updateIssue({
        issueId: issue._id,
        title: title || undefined,
        description: description || undefined,
      });
      showSuccess("Issue updated");
      setIsEditing(false);
    } catch (error) {
      showError(error, "Failed to update issue");
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard
      .writeText(issue.key)
      .then(() => {
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
      })
      .catch((err) => {
        showError(err, "Failed to copy issue key");
      });
  };

  return (
    <div className="flex flex-col h-full bg-ui-bg-primary">
      {/* Top Navigation / Breadcrumbs */}
      <div className="border-b border-ui-border-primary bg-ui-bg-primary px-6 py-3">
        <Flex align="center" justify="between">
          <Flex align="center" gap="md">
            <Button asChild variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
              <Link to={ROUTES.projects.board.path} params={{ orgSlug, key: projectKey }}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                {projectKey}
              </Link>
            </Button>
            <span className="text-ui-text-tertiary">/</span>
            <Flex align="center" gap="sm">
              <span className="text-lg">{getTypeIcon(issue.type)}</span>
              <span className="font-mono text-sm text-ui-text-secondary">{issue.key}</span>
              <Tooltip content={hasCopied ? "Copied!" : "Copy issue key"}>
                <Button variant="ghost" size="sm" onClick={handleCopyKey} className="h-6 w-6 p-0">
                  {hasCopied ? (
                    <Check className="w-3 h-3 text-status-success" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </Tooltip>
            </Flex>
          </Flex>

          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit Issue
            </Button>
          )}
        </Flex>
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row">
          {/* Main Content Area (Left/Top) */}
          <div className="flex-1 min-w-0 p-6 space-y-8 max-w-4xl border-r border-ui-border-primary">
            {/* Title & Description */}
            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-2xl font-bold h-auto py-2"
                    placeholder="Issue title"
                  />
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={8}
                    className="text-base"
                    placeholder="Add a description..."
                  />
                  <Flex gap="sm">
                    <Button onClick={handleSave}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </Flex>
                </div>
              ) : (
                <>
                  <Typography variant="h1" className="text-3xl font-semibold border-none">
                    {issue.title}
                  </Typography>
                  <div className="prose max-w-none">
                    <Typography variant="p" className="text-base text-ui-text-secondary">
                      {issue.description || (
                        <span className="italic text-ui-text-tertiary">
                          No description provided
                        </span>
                      )}
                    </Typography>
                  </div>
                </>
              )}
            </div>

            {/* Sub-tasks Section */}
            {issue.type !== "subtask" && (
              <div>
                <Typography
                  variant="h3"
                  className="text-sm font-semibold mb-4 uppercase tracking-wider text-ui-text-tertiary"
                >
                  Sub-tasks
                </Typography>
                <SubtasksList issueId={issue._id} projectId={issue.projectId} subtasks={subtasks} />
              </div>
            )}

            {/* Comments Section */}
            <div className="pt-8 border-t border-ui-border-primary">
              <Typography
                variant="h3"
                className="text-sm font-semibold mb-6 uppercase tracking-wider text-ui-text-tertiary"
              >
                Comments
              </Typography>
              <IssueComments issueId={issue._id} projectId={issue.projectId} />
            </div>
          </div>

          {/* Sidebar Area (Right/Bottom) */}
          <div className="w-full md:w-80 lg:w-96 p-6 space-y-8 bg-ui-bg-secondary/30">
            {/* Properties Summary */}
            <section>
              <Typography
                variant="h4"
                className="text-xs font-bold uppercase tracking-widest text-ui-text-tertiary mb-4"
              >
                Properties
              </Typography>
              <IssueMetadataSection
                status={issue.status}
                type={issue.type}
                assignee={issue.assignee}
                reporter={issue.reporter}
                storyPoints={issue.storyPoints}
                labels={issue.labels}
              />
            </section>

            {/* Time Tracking */}
            <section>
              <Typography
                variant="h4"
                className="text-xs font-bold uppercase tracking-widest text-ui-text-tertiary mb-4"
              >
                Time Tracking
              </Typography>
              <TimeTracker
                issueId={issue._id}
                projectId={issue.projectId}
                estimatedHours={issue.estimatedHours}
                billingEnabled={billingEnabled}
              />
            </section>

            {/* Attachments */}
            <section>
              <Typography
                variant="h4"
                className="text-xs font-bold uppercase tracking-widest text-ui-text-tertiary mb-4"
              >
                Attachments
              </Typography>
              <FileAttachments issueId={issue._id} />
            </section>

            {/* Relationships */}
            <section className="space-y-6">
              <div>
                <Typography
                  variant="h4"
                  className="text-xs font-bold uppercase tracking-widest text-ui-text-tertiary mb-4"
                >
                  Watchers
                </Typography>
                <IssueWatchers issueId={issue._id} />
              </div>
              <div>
                <Typography
                  variant="h4"
                  className="text-xs font-bold uppercase tracking-widest text-ui-text-tertiary mb-4"
                >
                  Dependencies
                </Typography>
                <IssueDependencies issueId={issue._id} projectId={issue.projectId} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
