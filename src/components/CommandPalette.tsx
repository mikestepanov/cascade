import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Input } from "./ui/form/Input";
import { ModalBackdrop } from "./ui/ModalBackdrop";

export interface Command {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  keywords?: string[];
  action: () => void;
  group?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const filteredCommands = commands.filter((cmd) => {
    const searchLower = search.toLowerCase();
    const labelMatch = cmd.label.toLowerCase().includes(searchLower);
    const descMatch = cmd.description?.toLowerCase().includes(searchLower);
    const keywordMatch = cmd.keywords?.some((k) => k.toLowerCase().includes(searchLower));

    return labelMatch || descMatch || keywordMatch;
  });

  // Group commands
  const groupedCommands = filteredCommands.reduce(
    (acc, cmd) => {
      const group = cmd.group || "Other";
      if (!acc[group]) acc[group] = [];
      acc[group].push(cmd);
      return acc;
    },
    {} as Record<string, Command[]>,
  );

  const allFilteredCommands = Object.values(groupedCommands).flat();

  useEffect(() => {
    setSelectedIndex(0);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allFilteredCommands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = allFilteredCommands[selectedIndex];
      if (cmd) {
        cmd.action();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <ModalBackdrop onClick={onClose} zIndex="z-50" animated={false} />

      {/* Command Palette */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-[20vh] p-4">
        <div
          role="dialog"
          aria-label="Command palette"
          className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                <svg
                  aria-hidden="true"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <Input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="pl-10 pr-4 py-2 sm:py-3 text-base sm:text-lg border-none focus:outline-none bg-transparent text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Commands List */}
          <div className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
            {allFilteredCommands.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p>No commands found</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([group, cmds], groupIndex) => (
                <div key={group}>
                  {groupIndex > 0 && <div className="border-t border-gray-200 dark:border-gray-700" />}
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                    {group}
                  </div>
                  {cmds.map((cmd, _cmdIndex) => {
                    const globalIndex = allFilteredCommands.indexOf(cmd);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        type="button"
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                          isSelected ? "bg-blue-50 dark:bg-blue-900/30" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        {cmd.icon && <span className="text-xl">{cmd.icon}</span>}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{cmd.description}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-3 sm:gap-4">
            <span>
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300">Enter</kbd> Select
            </span>
            <span>
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300">Esc</kbd> Close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook to build commands dynamically
export function useCommands({
  onNavigate,
  onCreateIssue,
  onCreateDocument,
  onCreateProject,
}: {
  onNavigate: (view: "dashboard" | "documents" | "projects") => void;
  onCreateIssue?: () => void;
  onCreateDocument?: () => void;
  onCreateProject?: () => void;
}) {
  const _projects = useQuery(api.dashboard.getMyProjects);
  const _documents = useQuery(api.documents.list);
  const myIssues = useQuery(api.dashboard.getMyIssues);

  const commands: Command[] = [
    // Navigation
    {
      id: "nav-dashboard",
      label: "Go to Dashboard",
      icon: "🏠",
      description: "View your personal dashboard",
      keywords: ["home", "my work"],
      action: () => onNavigate("dashboard"),
      group: "Navigation",
    },
    {
      id: "nav-documents",
      label: "Go to Documents",
      icon: "📄",
      description: "View all documents",
      keywords: ["docs", "files"],
      action: () => onNavigate("documents"),
      group: "Navigation",
    },
    {
      id: "nav-projects",
      label: "Go to Projects",
      icon: "📋",
      description: "View all projects",
      keywords: ["boards", "kanban"],
      action: () => onNavigate("projects"),
      group: "Navigation",
    },

    // Create actions
    ...(onCreateIssue
      ? [
          {
            id: "create-issue",
            label: "Create Issue",
            icon: "➕",
            description: "Create a new issue",
            keywords: ["new", "task", "bug"],
            action: onCreateIssue,
            group: "Create",
          },
        ]
      : []),
    ...(onCreateDocument
      ? [
          {
            id: "create-document",
            label: "Create Document",
            icon: "📝",
            description: "Create a new document",
            keywords: ["new", "doc", "page"],
            action: onCreateDocument,
            group: "Create",
          },
        ]
      : []),
    ...(onCreateProject
      ? [
          {
            id: "create-project",
            label: "Create Project",
            icon: "🗂️",
            description: "Create a new project",
            keywords: ["new", "board"],
            action: onCreateProject,
            group: "Create",
          },
        ]
      : []),

    // Quick access to recent issues
    ...(myIssues?.slice(0, 5).map((issue) => ({
      id: `issue-${issue._id}`,
      label: issue.title,
      icon: issue.type === "bug" ? "🐛" : issue.type === "story" ? "📖" : "📋",
      description: `${issue.key} • ${issue.projectName}`,
      keywords: [issue.key, issue.projectName || ""],
      action: () => {
        // Navigate to project - will be handled by parent
      },
      group: "Recent Issues",
    })) || []),
  ];

  return commands;
}
