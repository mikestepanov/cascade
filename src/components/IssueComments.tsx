import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { CommentRenderer } from "./CommentRenderer";
import { MentionInput } from "./MentionInput";
import { Button } from "./ui/Button";

interface IssueCommentsProps {
  issueId: Id<"issues">;
  projectId: Id<"projects">;
}

export function IssueComments({ issueId, projectId }: IssueCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [mentions, setMentions] = useState<Id<"users">[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issue = useQuery(api.issues.get, { id: issueId });
  const addComment = useMutation(api.issues.addComment);

  const comments = issue?.comments || [];

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
      toast.success("Comment added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg
              aria-hidden="true"
              className="w-12 h-12 mx-auto mb-3 text-gray-400"
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
            <p>No comments yet</p>
            <p className="text-sm mt-1">Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {comment.author.image ? (
                  <img
                    src={comment.author.image}
                    alt={comment.author.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Comment Content */}
              <div className="flex-1 min-w-0">
                {/* Author and Date */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {comment.author.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(comment.createdAt)}
                  </span>
                  {comment.updatedAt > comment.createdAt && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">(edited)</span>
                  )}
                </div>

                {/* Comment Text with Mentions */}
                <CommentRenderer content={comment.content} mentions={comment.mentions} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Comment</h4>
        <MentionInput
          projectId={projectId}
          value={newComment}
          onChange={setNewComment}
          onMentionsChange={setMentions}
          placeholder="Add a comment... Type @ to mention someone"
        />
        <div className="flex justify-end">
          <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={!newComment.trim()}>
            Add Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
