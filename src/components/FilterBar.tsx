import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/Dialog";
import { Flex } from "./ui/Flex";
import { Checkbox, Input } from "./ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { Tooltip } from "./ui/Tooltip";

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
    <div className="bg-ui-bg-secondary border-b border-ui-border-primary p-4">
      <Flex align="center" gap="md" className="flex-wrap">
        {/* Saved Filters Dropdown */}
        <Flex align="center" gap="sm">
          <label htmlFor="savedFilters" className="text-sm font-medium text-ui-text-primary">
            Saved Filters:
          </label>
          <Select
            value=""
            onValueChange={(value) => {
              if (value) {
                const selected = savedFilters?.find((f: Doc<"savedFilters">) => f._id === value);
                if (selected) {
                  handleLoadFilter(selected.filters);
                }
              }
            }}
          >
            <SelectTrigger className="px-3 py-1.5 border border-ui-border-primary rounded-lg bg-ui-bg-primary text-sm">
              <SelectValue placeholder="Select a filter..." />
            </SelectTrigger>
            <SelectContent>
              {savedFilters?.map(
                (filter: Doc<"savedFilters"> & { isOwner?: boolean; creatorName?: string }) => (
                  <SelectItem key={filter._id} value={filter._id}>
                    {filter.name} {filter.isPublic && "(Public)"}{" "}
                    {!filter.isOwner && `- by ${filter.creatorName}`}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </Flex>

        {/* Save Current Filter */}
        {hasActiveFilters && (
          <Button size="sm" onClick={() => setShowSaveDialog(true)}>
            💾 Save Filter
          </Button>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="secondary" size="sm" onClick={handleClearFilters}>
            ✕ Clear
          </Button>
        )}

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="text-sm text-ui-text-secondary">
            {Object.keys(activeFilters).length} filter(s) active
          </div>
        )}
      </Flex>

      {/* Save Filter Dialog */}
      <Dialog
        open={showSaveDialog}
        onOpenChange={(open) => {
          setShowSaveDialog(open);
          if (!open) {
            setFilterName("");
            setIsPublic(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription className="sr-only">Save current filter settings</DialogDescription>
          </DialogHeader>
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
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShowSaveDialog(false);
                setFilterName("");
                setIsPublic(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveFilter}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* My Filters List (if any saved) */}
      {savedFilters && savedFilters.length > 0 && (
        <Flex wrap gap="sm" className="mt-3">
          {savedFilters.slice(0, 5).map((filter: Doc<"savedFilters"> & { isOwner?: boolean }) => (
            <Flex
              inline
              align="center"
              gap="sm"
              className="px-3 py-1 bg-ui-bg-primary border border-ui-border-primary rounded-full text-sm"
              key={filter._id}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLoadFilter(filter.filters)}
                className="p-0 min-h-0 hover:text-brand-600"
              >
                {filter.name}
              </Button>
              {filter.isOwner && (
                <Tooltip content="Delete filter">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFilter(filter._id)}
                    className="p-0 min-h-0 text-ui-text-tertiary hover:text-status-error"
                    aria-label="Delete filter"
                  >
                    ✕
                  </Button>
                </Tooltip>
              )}
            </Flex>
          ))}
        </Flex>
      )}
    </div>
  );
}
