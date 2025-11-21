import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Checkbox, Input } from "./ui/form";
import { ModalBackdrop } from "./ui/ModalBackdrop";

type FilterValues = Record<string, unknown>;

interface FilterBarProps {
  projectId: Id<"projects">;
  onFilterChange: (filters: FilterValues) => void;
}

export function FilterBar({ projectId, onFilterChange }: FilterBarProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterValues>({});

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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save filter");
    }
  };

  const handleLoadFilter = (filters: FilterValues) => {
    setActiveFilters(filters);
    onFilterChange(filters);
    toast.success("Filter applied");
  };

  const handleDeleteFilter = async (id: Id<"savedFilters">) => {
    try {
      await removeFilter({ id });
      toast.success("Filter deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete filter");
    }
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    onFilterChange({});
    toast.success("Filters cleared");
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark border-b border-ui-border-primary dark:border-ui-border-primary-dark p-4">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Saved Filters Dropdown */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="savedFilters"
            className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark"
          >
            Saved Filters:
          </label>
          <select
            id="savedFilters"
            onChange={(e) => {
              if (e.target.value) {
                const selected = savedFilters?.find((f) => f._id === e.target.value);
                if (selected) {
                  handleLoadFilter(selected.filters);
                }
              }
            }}
            className="px-3 py-1.5 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-sm"
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
            type="button"
            onClick={() => setShowSaveDialog(true)}
            className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700"
          >
            💾 Save Filter
          </button>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-3 py-1.5 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-primary dark:text-ui-text-primary-dark rounded-lg text-sm hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark"
          >
            ✕ Clear
          </button>
        )}

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
            {Object.keys(activeFilters).length} filter(s) active
          </div>
        )}
      </div>

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <>
          <ModalBackdrop onClick={() => setShowSaveDialog(false)} zIndex="z-50" animated={false} />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            {/* biome-ignore lint/a11y/noStaticElementInteractions: Modal content needs stopPropagation to prevent backdrop clicks */}
            <div
              className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg p-6 max-w-md w-full mx-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-ui-text-primary dark:text-ui-text-primary-dark">
                Save Filter
              </h3>

              <div className="space-y-4">
                <Input
                  label="Filter Name"
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="e.g., High Priority Bugs"
                />

                <Checkbox
                  label="Share with team (make public)"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveDialog(false);
                      setFilterName("");
                      setIsPublic(false);
                    }}
                    className="px-4 py-2 text-ui-text-primary dark:text-ui-text-primary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFilter}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* My Filters List (if any saved) */}
      {savedFilters && savedFilters.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {savedFilters.slice(0, 5).map((filter) => (
            <div
              key={filter._id}
              className="inline-flex items-center gap-2 px-3 py-1 bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-full text-sm"
            >
              <button
                type="button"
                onClick={() => handleLoadFilter(filter.filters)}
                className="hover:text-brand-600"
              >
                {filter.name}
              </button>
              {filter.isOwner && (
                <button
                  type="button"
                  onClick={() => handleDeleteFilter(filter._id)}
                  className="text-ui-text-tertiary hover:text-status-error"
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
