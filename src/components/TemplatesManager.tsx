import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface TemplatesManagerProps {
  projectId: Id<"projects">;
}

type IssueType = "task" | "bug" | "story" | "epic";
type IssuePriority = "lowest" | "low" | "medium" | "high" | "highest";

export function TemplatesManager({ projectId }: TemplatesManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<Id<"issueTemplates"> | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<IssueType>("task");
  const [titleTemplate, setTitleTemplate] = useState("");
  const [descriptionTemplate, setDescriptionTemplate] = useState("");
  const [defaultPriority, setDefaultPriority] = useState<IssuePriority>("medium");
  const [defaultLabels, setDefaultLabels] = useState("");

  const templates = useQuery(api.templates.list, { projectId });
  const labels = useQuery(api.labels.list, { projectId });
  const createTemplate = useMutation(api.templates.create);
  const updateTemplate = useMutation(api.templates.update);
  const deleteTemplate = useMutation(api.templates.remove);

  const resetForm = () => {
    setName("");
    setType("task");
    setTitleTemplate("");
    setDescriptionTemplate("");
    setDefaultPriority("medium");
    setDefaultLabels("");
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createTemplate({
        projectId,
        name: name.trim(),
        type,
        titleTemplate: titleTemplate.trim(),
        descriptionTemplate: descriptionTemplate.trim(),
        defaultPriority,
        defaultLabels: defaultLabels.split(",").map(l => l.trim()).filter(Boolean),
      });
      toast.success("Template created");
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to create template");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      await updateTemplate({
        id: editingId,
        name: name.trim(),
        type,
        titleTemplate: titleTemplate.trim(),
        descriptionTemplate: descriptionTemplate.trim(),
        defaultPriority,
        defaultLabels: defaultLabels.split(",").map(l => l.trim()).filter(Boolean),
      });
      toast.success("Template updated");
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to update template");
    }
  };

  const startEdit = (template: any) => {
    setEditingId(template._id);
    setName(template.name);
    setType(template.type);
    setTitleTemplate(template.titleTemplate);
    setDescriptionTemplate(template.descriptionTemplate);
    setDefaultPriority(template.defaultPriority);
    setDefaultLabels(template.defaultLabels?.join(", ") || "");
    setIsCreating(false);
  };

  const handleDelete = async (id: Id<"issueTemplates">) => {
    if (!confirm("Delete this template?")) return;

    try {
      await deleteTemplate({ id });
      toast.success("Template deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete template");
    }
  };

  const getTypeIcon = (type: IssueType) => {
    switch (type) {
      case "bug": return "🐛";
      case "story": return "📖";
      case "epic": return "⚡";
      default: return "✓";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Issue Templates</h3>
          <p className="text-sm text-gray-500 mt-1">Create reusable templates for common issue types</p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Template
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Create/Edit Form */}
        {(isCreating || editingId) && (
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Bug Report, Feature Request"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as IssueType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="task">Task</option>
                    <option value="bug">Bug</option>
                    <option value="story">Story</option>
                    <option value="epic">Epic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title Template *
                </label>
                <input
                  type="text"
                  value={titleTemplate}
                  onChange={(e) => setTitleTemplate(e.target.value)}
                  placeholder="e.g., [BUG] {description}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Use {`{placeholders}`} for dynamic content</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description Template
                </label>
                <textarea
                  value={descriptionTemplate}
                  onChange={(e) => setDescriptionTemplate(e.target.value)}
                  placeholder="## Steps to Reproduce&#10;1. &#10;2. &#10;&#10;## Expected Result&#10;&#10;## Actual Result"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Priority
                  </label>
                  <select
                    value={defaultPriority}
                    onChange={(e) => setDefaultPriority(e.target.value as IssuePriority)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="lowest">Lowest</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="highest">Highest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Labels (comma separated)
                  </label>
                  <input
                    type="text"
                    value={defaultLabels}
                    onChange={(e) => setDefaultLabels(e.target.value)}
                    placeholder="bug, frontend, urgent"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                {editingId ? "Update" : "Create"} Template
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Templates List */}
        {!templates || templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>No templates yet</p>
            <p className="text-sm mt-1">Create templates to speed up issue creation</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template._id}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getTypeIcon(template.type)}</span>
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded capitalize">
                        {template.type}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded capitalize">
                        {template.defaultPriority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Title:</span> {template.titleTemplate}
                    </p>
                    {template.descriptionTemplate && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {template.descriptionTemplate}
                      </p>
                    )}
                    {template.defaultLabels && template.defaultLabels.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {template.defaultLabels.map((label, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-white border border-gray-300 rounded"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isCreating && !editingId && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => startEdit(template)}
                        className="p-1 text-gray-600 hover:text-blue-600 rounded"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(template._id)}
                        className="p-1 text-gray-600 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
