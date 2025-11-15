import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface LabelsManagerProps {
  projectId: Id<"projects">;
}

const PRESET_COLORS = [
  "#EF4444", // red
  "#F59E0B", // amber
  "#10B981", // emerald
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#6B7280", // gray
  "#14B8A6", // teal
];

export function LabelsManager({ projectId }: LabelsManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<Id<"labels"> | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const labels = useQuery(api.labels.list, { projectId });
  const createLabel = useMutation(api.labels.create);
  const updateLabel = useMutation(api.labels.update);
  const deleteLabel = useMutation(api.labels.remove);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createLabel({ projectId, name: name.trim(), color });
      toast.success("Label created");
      setName("");
      setColor(PRESET_COLORS[0]);
      setIsCreating(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create label");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !name.trim()) return;

    try {
      await updateLabel({ id: editingId, name: name.trim(), color });
      toast.success("Label updated");
      setEditingId(null);
      setName("");
      setColor(PRESET_COLORS[0]);
    } catch (error: any) {
      toast.error(error.message || "Failed to update label");
    }
  };

  const startEdit = (label: any) => {
    setEditingId(label._id);
    setName(label.name);
    setColor(label.color);
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setName("");
    setColor(PRESET_COLORS[0]);
  };

  const handleDelete = async (id: Id<"labels">) => {
    if (!confirm("Delete this label? It will be removed from all issues.")) return;

    try {
      await deleteLabel({ id });
      toast.success("Label deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete label");
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Labels</h3>
          <p className="text-sm text-gray-500 mt-1">Organize issues with colored labels</p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Label
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Create/Edit Form */}
        {(isCreating || editingId) && (
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., bug, feature, urgent"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((presetColor) => (
                    <button
                      key={presetColor}
                      type="button"
                      onClick={() => setColor(presetColor)}
                      className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                        color === presetColor ? "ring-2 ring-offset-2 ring-gray-900" : ""
                      }`}
                      style={{ backgroundColor: presetColor }}
                      title={presetColor}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: color }}
                >
                  {name || "Label name"}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                {editingId ? "Update" : "Create"} Label
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Labels List */}
        {!labels || labels.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🏷️</div>
            <p>No labels yet</p>
            <p className="text-sm mt-1">Create labels to organize your issues</p>
          </div>
        ) : (
          <div className="space-y-2">
            {labels.map((label) => (
              <div
                key={label._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                  <span className="text-xs text-gray-500">{label.color}</span>
                </div>

                {!isCreating && !editingId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(label)}
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
                      onClick={() => handleDelete(label._id)}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
