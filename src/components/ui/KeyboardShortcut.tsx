import { cn } from "@/lib/utils";
import { Flex } from "./Flex";

interface KeyboardShortcutProps {
  /**
   * The keyboard shortcut to display
   * Can be a single key or multiple keys separated by +
   * Examples: "Ctrl+K", "⌘+Shift+P", "Enter"
   */
  shortcut: string;

  /**
   * Size variant
   */
  size?: "sm" | "md";

  /**
   * Visual variant
   */
  variant?: "default" | "subtle";

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * KeyboardShortcut component for displaying keyboard shortcuts
 *
 * @example
 * // Single key
 * <KeyboardShortcut shortcut="Enter" />
 *
 * // Multiple keys
 * <KeyboardShortcut shortcut="Ctrl+K" />
 *
 * // With modifier symbols
 * <KeyboardShortcut shortcut="⌘+Shift+P" />
 */
export function KeyboardShortcut({
  shortcut,
  size = "sm",
  variant = "default",
  className = "",
}: KeyboardShortcutProps) {
  const keys = shortcut.split("+").map((key) => key.trim());

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 min-w-[20px]",
    md: "text-sm px-2 py-1 min-w-[24px]",
  };

  const variantClasses = {
    default:
      "bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark shadow-sm",
    subtle:
      "bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark text-ui-text-secondary dark:text-ui-text-secondary-dark",
  };

  // Create keys with unique identifiers for stable rendering
  const keysWithIds = keys.map((key, idx) => ({
    key,
    id: `${shortcut.replace(/\+/g, "-")}-${idx}`,
  }));

  return (
    <Flex as="span" inline align="center" gap="xs" className={className}>
      {keysWithIds.map(({ key, id }, index) => (
        <span key={id} className="contents">
          <kbd
            className={cn(
              "inline-flex items-center justify-center font-mono rounded",
              sizeClasses[size],
              variantClasses[variant],
            )}
          >
            {formatKey(key)}
          </kbd>
          {index < keysWithIds.length - 1 && (
            <span className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark mx-0.5">+</span>
          )}
        </span>
      ))}
    </Flex>
  );
}

/**
 * Format key for display (handle common abbreviations)
 */
function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    ctrl: "Ctrl",
    control: "Ctrl",
    cmd: "⌘",
    command: "⌘",
    alt: "Alt",
    option: "⌥",
    shift: "⇧",
    enter: "↵",
    return: "↵",
    esc: "Esc",
    escape: "Esc",
    tab: "Tab",
    space: "Space",
    backspace: "⌫",
    delete: "Del",
    up: "↑",
    down: "↓",
    left: "←",
    right: "→",
  };

  const lowerKey = key.toLowerCase();
  return keyMap[lowerKey] || key;
}

/**
 * Convenience component for displaying a list of shortcuts
 */
interface ShortcutListProps {
  shortcuts: Array<{
    keys: string;
    description: string;
  }>;
  className?: string;
}

export function ShortcutList({ shortcuts, className = "" }: ShortcutListProps) {
  return (
    <Flex direction="column" gap="sm" className={className}>
      {shortcuts.map((shortcut) => (
        <Flex key={shortcut.keys} align="center" justify="between" gap="lg" className="text-sm">
          <span className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
            {shortcut.description}
          </span>
          <KeyboardShortcut shortcut={shortcut.keys} />
        </Flex>
      ))}
    </Flex>
  );
}
