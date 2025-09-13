import { Id } from "../../convex/_generated/dataModel";

interface Issue {
  _id: Id<"issues">;
  key: string;
  title: string;
  type: "task" | "bug" | "story" | "epic";
  priority: "lowest" | "low" | "medium" | "high" | "highest";
  assignee?: {
    _id: Id<"users">;
    name: string;
    image?: string;
  } | null;
  labels: string[];
}

interface IssueCardProps {
  issue: Issue;
  onDragStart: (e: React.DragEvent) => void;
  onClick?: () => void;
}

export function IssueCard({ issue, onDragStart, onClick }: IssueCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return "🐛";
      case "story":
        return "📖";
      case "epic":
        return "⚡";
      default:
        return "✓";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "highest":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-blue-600";
      case "lowest":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "highest":
        return "↑↑";
      case "high":
        return "↑";
      case "medium":
        return "→";
      case "low":
        return "↓";
      case "lowest":
        return "↓↓";
      default:
        return "→";
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm">{getTypeIcon(issue.type)}</span>
          <span className="text-xs text-gray-500 font-mono">{issue.key}</span>
        </div>
        <div className={`text-xs ${getPriorityColor(issue.priority)}`}>
          {getPriorityIcon(issue.priority)}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
        {issue.title}
      </h4>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {issue.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
            >
              {label}
            </span>
          ))}
          {issue.labels.length > 3 && (
            <span className="text-xs text-gray-500">+{issue.labels.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {issue.assignee && (
            <div className="flex items-center space-x-1">
              {issue.assignee.image ? (
                <img
                  src={issue.assignee.image}
                  alt={issue.assignee.name}
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                  {issue.assignee.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
