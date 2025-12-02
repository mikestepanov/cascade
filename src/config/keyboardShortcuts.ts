import type { KeySequence } from "../hooks/useKeyboardShortcuts";

export interface ShortcutHandlers {
  navigate: (to: string) => void;
  setShowCommandPalette: (show: boolean) => void;
  setShowShortcutsHelp: (show: boolean) => void;
  setShowAIAssistant: (toggle: boolean) => void;
}

export function createKeyboardShortcuts(handlers: ShortcutHandlers) {
  const shortcuts = [
    // Command palette (Cmd/Ctrl+K)
    {
      key: "k",
      meta: true,
      handler: () => handlers.setShowCommandPalette(true),
      description: "Open command palette",
      global: true,
    },
    {
      key: "k",
      ctrl: true,
      handler: () => handlers.setShowCommandPalette(true),
      description: "Open command palette",
      global: true,
    },
    // Help (?)
    {
      key: "?",
      shift: true,
      handler: () => handlers.setShowShortcutsHelp(true),
      description: "Show keyboard shortcuts",
      global: true,
    },
    // AI Assistant (Cmd/Ctrl+Shift+A)
    {
      key: "a",
      meta: true,
      shift: true,
      handler: () => handlers.setShowAIAssistant(true),
      description: "Toggle AI assistant",
      global: true,
    },
    {
      key: "a",
      ctrl: true,
      shift: true,
      handler: () => handlers.setShowAIAssistant(true),
      description: "Toggle AI assistant",
      global: true,
    },
    // Quick navigation (Cmd/Ctrl+number)
    {
      key: "1",
      meta: true,
      handler: () => handlers.navigate("/dashboard"),
      description: "Go to dashboard",
    },
    {
      key: "2",
      meta: true,
      handler: () => handlers.navigate("/documents"),
      description: "Go to documents",
    },
    {
      key: "3",
      meta: true,
      handler: () => handlers.navigate("/projects"),
      description: "Go to projects",
    },
    // Single-key actions (only when not typing)
    {
      key: "c",
      handler: () => {
        window.dispatchEvent(new CustomEvent("nixelo:create-issue"));
      },
      description: "Create new issue",
    },
    {
      key: "d",
      handler: () => {
        window.dispatchEvent(new CustomEvent("nixelo:create-document"));
      },
      description: "Create new document",
    },
    {
      key: "p",
      handler: () => {
        window.dispatchEvent(new CustomEvent("nixelo:create-project"));
      },
      description: "Create new project",
    },
  ];

  return shortcuts;
}

export function createKeySequences(handlers: ShortcutHandlers): KeySequence[] {
  return [
    {
      keys: ["g", "h"],
      handler: () => handlers.navigate("/dashboard"),
      description: "Go to home",
    },
    {
      keys: ["g", "b"],
      handler: () => handlers.navigate("/projects"),
      description: "Go to board",
    },
    {
      keys: ["g", "d"],
      handler: () => handlers.navigate("/documents"),
      description: "Go to documents",
    },
  ];
}
