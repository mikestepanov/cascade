import type { Id } from "@convex/_generated/dataModel";

interface CommentRendererProps {
  content: string;
  mentions?: Id<"users">[];
}

export function CommentRenderer({ content, mentions: _mentions = [] }: CommentRendererProps) {
  // Parse the content to find mentions and replace with highlighted spans
  const renderContent = () => {
    const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    match = mentionPattern.exec(content);
    while (match !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${key++}`}>{content.substring(lastIndex, match.index)}</span>);
      }

      // Add highlighted mention
      const userName = match[1];
      const userId = match[2] as Id<"users">;

      parts.push(<MentionBadge key={`mention-${key++}`} userName={userName} userId={userId} />);

      lastIndex = match.index + match[0].length;
      match = mentionPattern.exec(content);
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(<span key={`text-${key++}`}>{content.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <div className="text-ui-text-primary whitespace-pre-wrap break-words">{renderContent()}</div>
  );
}

interface MentionBadgeProps {
  userName: string;
  userId: Id<"users">;
}

function MentionBadge({ userName }: MentionBadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded bg-brand-100 text-brand-800 font-medium hover:bg-brand-200:bg-brand-800 transition-colors cursor-default"
      title={`@${userName}`}
    >
      @{userName}
    </span>
  );
}
