import type { KeySequence } from "../hooks/useKeyboardShortcuts";
import { ROUTES } from "./routes";

export interface ShortcutHandlers {
  companySlug: string;
  navigate: (to: string) => void;
  setShowCommandPalette: (show: boolean) => void;
  setShowShortcutsHelp: (show: boolean) => void;
  setShowAIAssistant: (toggle: boolean) => void;
}

export function createKeyboardShortcuts(handlers: ShortcutHandlers) {
  const { companySlug } = handlers;
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
      handler: () => handlers.navigate(ROUTES.dashboard(companySlug)),
      description: "Go to dashboard",
    },
    {
      key: "2",
      meta: true,
      handler: () => handlers.navigate(ROUTES.documents.list(companySlug)),
      description: "Go to documents",
    },
    {
      key: "3",
      meta: true,
      handler: () => handlers.navigate(ROUTES.workspaces.list(companySlug)),
      description: "Go to workspaces",
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
  const { companySlug } = handlers;
  return [
    {
      keys: ["g", "h"],
      handler: () => handlers.navigate(ROUTES.dashboard(companySlug)),
      description: "Go to home",
    },
    {
      keys: ["g", "w"],
      handler: () => handlers.navigate(ROUTES.workspaces.list(companySlug)),
      description: "Go to workspaces",
    },
    {
      keys: ["g", "d"],
      handler: () => handlers.navigate(ROUTES.documents.list(companySlug)),
      description: "Go to documents",
    },
  ];
}
