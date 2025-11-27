import { KeyboardShortcut } from "./ui/KeyboardShortcut";
import { Modal } from "./ui/Modal";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const shortcuts = [
    {
      category: "General",
      items: [
        { keys: ["⌘+K", "Ctrl+K"], description: "Open command palette" },
        { keys: ["?"], description: "Show keyboard shortcuts" },
        { keys: ["/"], description: "Focus search" },
        { keys: ["Esc"], description: "Close modal or cancel" },
      ],
    },
    {
      category: "Navigation",
      items: [
        { keys: ["G", "H"], description: "Go to home" },
        { keys: ["G", "B"], description: "Go to board" },
        { keys: ["G", "R"], description: "Go to roadmap" },
        { keys: ["G", "A"], description: "Go to analytics" },
        { keys: ["G", "S"], description: "Go to settings" },
      ],
    },
    {
      category: "Actions",
      items: [
        { keys: ["C"], description: "Create new issue" },
        { keys: ["D"], description: "Create new document" },
        { keys: ["P"], description: "Create new project" },
      ],
    },
    {
      category: "Issue Actions",
      items: [
        { keys: ["E"], description: "Edit issue" },
        { keys: ["A"], description: "Assign to me" },
        { keys: ["L"], description: "Add label" },
        { keys: ["Shift", "P"], description: "Set priority" },
        { keys: ["Shift", "S"], description: "Change status" },
        { keys: ["T"], description: "Start time tracking" },
      ],
    },
    {
      category: "Editor",
      items: [
        { keys: ["⌘+B", "Ctrl+B"], description: "Bold" },
        { keys: ["⌘+I", "Ctrl+I"], description: "Italic" },
        { keys: ["⌘+U", "Ctrl+U"], description: "Underline" },
        { keys: ["⌘+Z", "Ctrl+Z"], description: "Undo" },
        { keys: ["⌘+Shift+Z", "Ctrl+Shift+Z"], description: "Redo" },
      ],
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" maxWidth="2xl">
      <div className="p-6 space-y-6">
        {shortcuts.map((section) => (
          <div key={section.category}>
            <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
              {section.category}
            </h3>
            <div className="space-y-2">
              {section.items.map((shortcut) => (
                <div key={shortcut.description} className="flex items-center justify-between py-2">
                  <span className="text-sm text-ui-text-primary dark:text-ui-text-primary-dark">
                    {shortcut.description}
                  </span>
                  <div className="flex gap-2">
                    {shortcut.keys.map((key) => (
                      <KeyboardShortcut key={key} shortcut={key} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-ui-border-primary dark:border-ui-border-primary-dark">
          <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
            <strong>Tip:</strong> Press <KeyboardShortcut shortcut="⌘+K" /> to quickly access all
            commands and features.
          </p>
        </div>
      </div>
    </Modal>
  );
}
