import { Id } from "../../convex/_generated/dataModel";

interface CommentRendererProps {
  content: string;
  mentions?: Id<"users">[];
}

export function CommentRenderer({ content, mentions = [] }: CommentRendererProps) {
  // Parse the content to find mentions and replace with highlighted spans
  const renderContent = () => {
    const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = mentionPattern.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${key++}`}>{content.substring(lastIndex, match.index)}</span>);
      }

      // Add highlighted mention
      const userName = match[1];
      const userId = match[2] as Id<"users">;

      parts.push(<MentionBadge key={`mention-${key++}`} userName={userName} userId={userId} />);

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(<span key={`text-${key++}`}>{content.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
      {renderContent()}
    </div>
  );
}

interface MentionBadgeProps {
  userName: string;
  userId: Id<"users">;
}

function MentionBadge({ userName }: MentionBadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-default"
      title={`@${userName}`}
    >
      @{userName}
    </span>
  );
}
