import { Modal } from "./ui/Modal";
import { Card, CardBody } from "./ui/Card";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const shortcuts = [
    {
      category: "General",
      items: [
        { keys: ["⌘", "K"], description: "Open command palette" },
        { keys: ["Ctrl", "K"], description: "Open command palette (Windows/Linux)" },
        { keys: ["?"], description: "Show keyboard shortcuts" },
        { keys: ["Esc"], description: "Close dialogs" },
      ],
    },
    {
      category: "Navigation",
      items: [
        { keys: ["⌘", "D"], description: "Go to Dashboard" },
        { keys: ["⌘", "1"], description: "Go to Dashboard" },
        { keys: ["⌘", "2"], description: "Go to Documents" },
        { keys: ["⌘", "3"], description: "Go to Projects" },
      ],
    },
    {
      category: "Command Palette",
      items: [
        { keys: ["↑", "↓"], description: "Navigate commands" },
        { keys: ["Enter"], description: "Execute selected command" },
        { keys: ["Esc"], description: "Close palette" },
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
              {section.items.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, keyIdx) => (
                      <kbd
                        key={keyIdx}
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
            <strong>Tip:</strong> Press <kbd className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">⌘ K</kbd> to quickly access all commands and features.
          </p>
        </div>
      </div>
    </Modal>
  );
}
