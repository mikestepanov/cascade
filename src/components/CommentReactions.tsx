import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Smile } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ReactionInfo } from "../../convex/lib/issueHelpers";
import { Flex } from "./ui/Flex";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";

interface CommentReactionsProps {
  commentId: Id<"issueComments">;
  reactions: ReactionInfo[];
  currentUserId?: Id<"users">;
}

const COMMON_EMOJIS = ["👍", "👎", "❤️", "🔥", "🚀", "👀", "✅", "🙌"];

export function CommentReactions({ commentId, reactions, currentUserId }: CommentReactionsProps) {
  const toggleReaction = useMutation(api.reactions.toggleReaction);
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = async (emoji: string) => {
    try {
      await toggleReaction({ commentId, emoji });
      setIsOpen(false);
    } catch {
      // Silently fail - UI shows current state
    }
  };

  return (
    <Flex align="center" gap="xs" wrap className="mt-2">
      {reactions.map((reaction) => {
        const hasReacted = currentUserId && reaction.userIds.includes(currentUserId);
        return (
          <button
            key={reaction.emoji}
            type="button"
            onClick={() => handleToggle(reaction.emoji)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-default border",
              hasReacted
                ? "bg-brand-subtle border-brand-border text-brand-subtle-foreground"
                : "bg-ui-bg-soft border-ui-border text-ui-text-secondary hover:border-ui-border-secondary hover:bg-ui-bg-hover",
            )}
          >
            <span>{reaction.emoji}</span>
            <span>{reaction.userIds.length}</span>
          </button>
        );
      })}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-ui-text-tertiary hover:text-ui-text-secondary hover:bg-ui-bg-hover transition-colors duration-default"
          >
            <Smile size={16} />
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-auto p-1">
          <Flex gap="xs">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleToggle(emoji)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-ui-bg-hover transition-colors duration-default text-lg"
              >
                {emoji}
              </button>
            ))}
          </Flex>
        </PopoverContent>
      </Popover>
    </Flex>
  );
}
