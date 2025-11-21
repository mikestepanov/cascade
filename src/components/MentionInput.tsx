import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface MentionInputProps {
  projectId: Id<"projects">;
  value: string;
  onChange: (value: string) => void;
  onMentionsChange: (mentions: Id<"users">[]) => void;
  placeholder?: string;
  className?: string;
}

export function MentionInput({
  projectId,
  value,
  onChange,
  onMentionsChange,
  placeholder = "Add a comment...",
  className = "",
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const members = useQuery(api.projectMembers.list, { projectId });

  // Filter members based on mention search
  const filteredMembers =
    members?.filter((member) =>
      member.userName.toLowerCase().includes(mentionSearch.toLowerCase()),
    ) || [];

  useEffect(() => {
    // Adjust textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check if user is typing @ mention
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionSearch(mentionMatch[1]);
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }

    // Extract all mentions from the text
    extractMentions(newValue);
  };

  const extractMentions = (text: string) => {
    const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentionIds: Id<"users">[] = [];
    let match: RegExpExecArray | null;

    match = mentionPattern.exec(text);
    while (match !== null) {
      mentionIds.push(match[2] as Id<"users">);
      match = mentionPattern.exec(text);
    }

    onMentionsChange(mentionIds);
  };

  const insertMention = (userName: string, userId: Id<"users">) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);

    // Find the @ symbol position
    const atIndex = textBeforeCursor.lastIndexOf("@");
    const beforeMention = textBeforeCursor.substring(0, atIndex);
    const mention = `@[${userName}](${userId})`;
    const newValue = `${beforeMention + mention} ${textAfterCursor}`;

    onChange(newValue);
    setShowSuggestions(false);
    setMentionSearch("");

    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + mention.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);

    extractMentions(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredMembers.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredMembers.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter": {
        if (e.shiftKey) return; // Allow Shift+Enter for new line
        e.preventDefault();
        const selectedMember = filteredMembers[selectedIndex];
        if (selectedMember) {
          insertMention(selectedMember.userName, selectedMember.userId);
        }
        break;
      }
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  // Display text with mentions rendered nicely
  const _renderValue = () => {
    if (!value) return null;

    const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    match = mentionPattern.exec(value);
    while (match !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(value.substring(lastIndex, match.index));
      }
      // Add mention
      parts.push(`@${match[1]}`);
      lastIndex = match.index + match[0].length;
      match = mentionPattern.exec(value);
    }

    // Add remaining text
    if (lastIndex < value.length) {
      parts.push(value.substring(lastIndex));
    }

    return parts.join("");
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-primary-dark dark:text-ui-text-primary-dark resize-none overflow-hidden ${className}`}
        rows={3}
      />

      {/* Mention Suggestions Dropdown */}
      {showSuggestions && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
          {filteredMembers.map((member, index) => (
            <button
              type="button"
              key={member.userId}
              onClick={() => insertMention(member.userName, member.userId)}
              className={`w-full px-4 py-2 text-left hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark flex items-center gap-3 ${
                index === selectedIndex ? "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark" : ""
              }`}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                {member.userName.charAt(0).toUpperCase()}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark truncate">
                  {member.userName}
                </p>
                <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark capitalize">
                  {member.role}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Helper text */}
      <p className="mt-1 text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
        Type @ to mention team members
      </p>
    </div>
  );
}
