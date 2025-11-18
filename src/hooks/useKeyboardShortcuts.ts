import { useCallback, useEffect } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (e: KeyboardEvent) => void;
  description: string;
  global?: boolean; // Works even when input is focused
  preventDefault?: boolean; // Default true
}

export interface KeySequence {
  keys: string[];
  description: string;
  handler: () => void;
  preventDefault?: boolean;
}

// Track the last pressed key for sequences (like 'g+h')
let lastKeyPressed: string | null = null;
let lastKeyTime = 0;
const SEQUENCE_TIMEOUT = 1000; // 1 second to complete a sequence

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input/textarea/contenteditable (unless shortcut is global)
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      for (const shortcut of shortcuts) {
        // Skip non-global shortcuts when typing
        if (isTyping && !shortcut.global) {
          continue;
        }

        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey;

        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch &&
          metaMatch
        ) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.handler(e);
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
}

/**
 * Enhanced hook for keyboard shortcuts with sequence support (like g+h)
 */
export function useKeyboardShortcutsWithSequences(
  shortcuts: KeyboardShortcut[],
  sequences: KeySequence[] = [],
  enabled = true,
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if typing in input/textarea/contenteditable
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      const key = e.key.toLowerCase();
      const now = Date.now();

      // Check for sequences (like g+h)
      if (lastKeyPressed && now - lastKeyTime < SEQUENCE_TIMEOUT) {
        const sequenceKey = `${lastKeyPressed}+${key}`;
        const sequence = sequences.find((s) => s.keys.join("+") === sequenceKey);

        if (sequence) {
          if (sequence.preventDefault !== false) {
            e.preventDefault();
          }
          sequence.handler();
          lastKeyPressed = null;
          return;
        }
      }

      // Update last key for sequences
      if (key === "g" && !isTyping) {
        lastKeyPressed = "g";
        lastKeyTime = now;
        return;
      }

      // Check for single key shortcuts
      for (const shortcut of shortcuts) {
        // Skip non-global shortcuts when typing
        if (isTyping && !shortcut.global) {
          continue;
        }

        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey;

        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch &&
          metaMatch
        ) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.handler(e);
          lastKeyPressed = null;
          return;
        }
      }

      // Reset sequence if no match
      if (lastKeyPressed && now - lastKeyTime > SEQUENCE_TIMEOUT) {
        lastKeyPressed = null;
      }
    },
    [shortcuts, sequences],
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.meta) parts.push("⌘");
  if (shortcut.ctrl) parts.push("Ctrl");
  if (shortcut.alt) parts.push("Alt");
  if (shortcut.shift) parts.push("Shift");

  parts.push(shortcut.key.toUpperCase());

  return parts.join(" + ");
}

export function getSequenceDisplay(sequence: KeySequence): string {
  return sequence.keys.map((k) => k.toUpperCase()).join(" → ");
}
