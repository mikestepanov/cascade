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
        { keys: ["⌘K", "Ctrl+K"], description: "Open command palette" },
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
        { keys: ["⌘B", "Ctrl+B"], description: "Bold" },
        { keys: ["⌘I", "Ctrl+I"], description: "Italic" },
        { keys: ["⌘U", "Ctrl+U"], description: "Underline" },
        { keys: ["⌘Z", "Ctrl+Z"], description: "Undo" },
        { keys: ["⌘Shift+Z", "Ctrl+Shift+Z"], description: "Redo" },
      ],
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" maxWidth="2xl">
      <div className="p-6 space-y-6">
        {shortcuts.map((section) => (
          <div key={section.category}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.category}</h3>
            <div className="space-y-2">
              {section.items.map((shortcut) => (
                <div key={shortcut.description} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key) => (
                      <kbd
                        key={key}
                        className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Tip:</strong> Press{" "}
            <kbd className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">⌘ K</kbd>{" "}
            to quickly access all commands and features.
          </p>
        </div>
      </div>
    </Modal>
  );
}
