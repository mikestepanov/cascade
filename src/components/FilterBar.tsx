import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface FilterBarProps {
  projectId: Id<"projects">;
  onFilterChange: (filters: any) => void;
}

export function FilterBar({ projectId, onFilterChange }: FilterBarProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});

  const savedFilters = useQuery(api.savedFilters.list, { projectId });
  const createFilter = useMutation(api.savedFilters.create);
  const removeFilter = useMutation(api.savedFilters.remove);

  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      toast.error("Please enter a filter name");
      return;
    }

    try {
      await createFilter({
        projectId,
        name: filterName,
        filters: activeFilters,
        isPublic,
      });
      toast.success("Filter saved");
      setShowSaveDialog(false);
      setFilterName("");
      setIsPublic(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save filter");
    }
  };

  const handleLoadFilter = (filters: any) => {
    setActiveFilters(filters);
    onFilterChange(filters);
    toast.success("Filter applied");
  };

  const handleDeleteFilter = async (id: Id<"savedFilters">) => {
    try {
      await removeFilter({ id });
      toast.success("Filter deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete filter");
    }
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    onFilterChange({});
    toast.success("Filters cleared");
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Saved Filters Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Saved Filters:
          </label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                const selected = savedFilters?.find((f) => f._id === e.target.value);
                if (selected) {
                  handleLoadFilter(selected.filters);
                }
              }
            }}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            value=""
          >
            <option value="">Select a filter...</option>
            {savedFilters?.map((filter) => (
              <option key={filter._id} value={filter._id}>
                {filter.name} {filter.isPublic && "(Public)"}{" "}
                {!filter.isOwner && `- by ${filter.creatorName}`}
              </option>
            ))}
          </select>
        </div>

        {/* Save Current Filter */}
        {hasActiveFilters && (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover"
          >
            💾 Save Filter
          </button>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            ✕ Clear
          </button>
        )}

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {Object.keys(activeFilters).length} filter(s) active
          </div>
        )}
      </div>

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Save Filter
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter Name
                </label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  placeholder="e.g., High Priority Bugs"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  id="public-filter"
                  className="rounded"
                />
                <label htmlFor="public-filter" className="text-sm text-gray-700 dark:text-gray-300">
                  Share with team (make public)
                </label>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setFilterName("");
                    setIsPublic(false);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFilter}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Filters List (if any saved) */}
      {savedFilters && savedFilters.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {savedFilters.slice(0, 5).map((filter) => (
            <div
              key={filter._id}
              className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-sm"
            >
              <button
                onClick={() => handleLoadFilter(filter.filters)}
                className="hover:text-primary"
              >
                {filter.name}
              </button>
              {filter.isOwner && (
                <button
                  onClick={() => handleDeleteFilter(filter._id)}
                  className="text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
