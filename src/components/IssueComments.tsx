import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, usePaginatedQuery } from "convex/react";
import { useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { formatRelativeTime } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { CommentRenderer } from "./CommentRenderer";
import { MentionInput } from "./MentionInput";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Typography } from "./ui/Typography";

interface IssueCommentsProps {
  issueId: Id<"issues">;
  projectId: Id<"projects">;
}

export function IssueComments({ issueId, projectId }: IssueCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [mentions, setMentions] = useState<Id<"users">[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    results: comments,
    status,
    loadMore,
  } = usePaginatedQuery(api.issues.listComments, { issueId }, { initialNumItems: 50 });

  const addComment = useMutation(api.issues.addComment);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment({
        issueId,
        content: newComment,
        mentions: mentions.length > 0 ? mentions : undefined,
      });

      setNewComment("");
      setMentions([]);
      showSuccess("Comment added");
    } catch (error) {
      showError(error, "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "LoadingFirstPage") {
    return <div className="p-8 text-center">Loading comments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Comments List */}
      <div className="space-y-4">
        {comments?.length === 0 ? (
          <div className="text-center py-8 text-ui-text-secondary">
            <svg
              aria-hidden="true"
              className="w-12 h-12 mx-auto mb-3 text-ui-text-tertiary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <Typography variant="p">No comments yet</Typography>
            <Typography variant="muted" className="mt-1">
              Be the first to comment!
            </Typography>
          </div>
        ) : (
          <>
            {comments?.map((comment) => (
              <Flex gap="md" className="p-4 bg-ui-bg-secondary rounded-lg" key={comment._id}>
                {/* Avatar */}
                <div className="shrink-0">
                  <Avatar name={comment.author?.name} src={comment.author?.image} size="lg" />
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  {/* Author and Date */}
                  <Flex align="center" gap="sm" className="mb-2">
                    <span className="font-medium text-ui-text-primary">
                      {comment.author?.name || "Unknown User"}
                    </span>
                    <span className="text-xs text-ui-text-secondary">
                      {formatRelativeTime(comment._creationTime)}
                    </span>
                    {comment.updatedAt > comment._creationTime && (
                      <span className="text-xs text-ui-text-tertiary">(edited)</span>
                    )}
                  </Flex>

                  {/* Comment Text with Mentions */}
                  <CommentRenderer content={comment.content} mentions={comment.mentions} />
                </div>
              </Flex>
            ))}

            {status === "CanLoadMore" && (
              <div className="text-center pt-2">
                <Button variant="secondary" onClick={() => loadMore(50)}>
                  Load More Comments
                </Button>
              </div>
            )}
            {status === "LoadingMore" && (
              <div className="text-center pt-2 text-sm text-ui-text-tertiary">Loading...</div>
            )}
          </>
        )}
      </div>

      {/* Add Comment */}
      <div className="space-y-3">
        <Typography variant="h4" className="text-sm font-medium text-ui-text-primary">
          Add Comment
        </Typography>
        <MentionInput
          projectId={projectId}
          value={newComment}
          onChange={setNewComment}
          onMentionsChange={setMentions}
          placeholder="Add a comment... Type @ to mention someone"
        />
        <Flex justify="end">
          <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={!newComment.trim()}>
            Add Comment
          </Button>
        </Flex>
      </div>
    </div>
  );
}
