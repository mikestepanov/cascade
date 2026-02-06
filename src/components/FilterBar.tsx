import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, X } from "@/lib/icons";
import type { IssuePriority, IssueType } from "@/lib/issue-utils";
import { getTypeIcon } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import { Flex } from "./ui/Flex";
import { Checkbox, Input } from "./ui/form";

export interface BoardFilters {
  type?: Exclude<IssueType, "subtask">[];
  priority?: IssuePriority[];
  assigneeId?: Id<"users">[];
  labels?: string[];
}

interface FilterBarProps {
  projectId: Id<"projects">;
  filters: BoardFilters;
  onFilterChange: (filters: BoardFilters) => void;
}

const ISSUE_TYPES = ["task", "bug", "story", "epic"] as const;
const PRIORITIES = ["highest", "high", "medium", "low", "lowest"] as const;

export function FilterBar({ projectId, filters, onFilterChange }: FilterBarProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const savedFilters = useQuery(api.savedFilters.list, { projectId });
  const createFilter = useMutation(api.savedFilters.create);
  const removeFilter = useMutation(api.savedFilters.remove);
  const labels = useQuery(api.labels.list, { projectId });
  const members = useQuery(api.projectMembers.list, { projectId });

  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      toast.error("Please enter a filter name");
      return;
    }

    try {
      await createFilter({
        projectId,
        name: filterName,
        filters: filters,
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

  const handleLoadFilter = useCallback(
    (savedFilter: Doc<"savedFilters">) => {
      onFilterChange(savedFilter.filters as BoardFilters);
      toast.success("Filter applied");
    },
    [onFilterChange],
  );

  const handleDeleteFilter = async (id: Id<"savedFilters">) => {
    try {
      await removeFilter({ id });
      toast.success("Filter deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete filter");
    }
  };

  const handleClearFilters = () => {
    onFilterChange({});
  };

  const toggleArrayFilter = useCallback(
    <K extends keyof BoardFilters>(
      key: K,
      value: BoardFilters[K] extends (infer U)[] | undefined ? U : never,
    ) => {
      const currentArray = (filters[key] ?? []) as (typeof value)[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((v) => v !== value)
        : [...currentArray, value];

      onFilterChange({
        ...filters,
        [key]: newArray.length > 0 ? newArray : undefined,
      });
    },
    [filters, onFilterChange],
  );

  const hasActiveFilters =
    (filters.type?.length ?? 0) > 0 ||
    (filters.priority?.length ?? 0) > 0 ||
    (filters.assigneeId?.length ?? 0) > 0 ||
    (filters.labels?.length ?? 0) > 0;

  const activeFilterCount =
    (filters.type?.length ?? 0) +
    (filters.priority?.length ?? 0) +
    (filters.assigneeId?.length ?? 0) +
    (filters.labels?.length ?? 0);

  return (
    <div className="bg-ui-bg-soft border-b border-ui-border px-4 py-2.5">
      <Flex align="center" gap="sm" className="flex-wrap">
        {/* Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 transition-default",
                filters.type?.length
                  ? "bg-brand-subtle text-brand border border-brand-border"
                  : "hover:bg-ui-bg-hover",
              )}
            >
              Type
              {filters.type?.length ? ` (${filters.type.length})` : ""}
              <ChevronDown className="ml-1 w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {ISSUE_TYPES.map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={filters.type?.includes(type) ?? false}
                onCheckedChange={() => toggleArrayFilter("type", type)}
              >
                <Flex align="center" gap="sm">
                  {getTypeIcon(type)}
                  <span className="capitalize">{type}</span>
                </Flex>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 transition-default",
                filters.priority?.length
                  ? "bg-brand-subtle text-brand border border-brand-border"
                  : "hover:bg-ui-bg-hover",
              )}
            >
              Priority
              {filters.priority?.length ? ` (${filters.priority.length})` : ""}
              <ChevronDown className="ml-1 w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {PRIORITIES.map((priority) => (
              <DropdownMenuCheckboxItem
                key={priority}
                checked={filters.priority?.includes(priority) ?? false}
                onCheckedChange={() => toggleArrayFilter("priority", priority)}
              >
                <span className="capitalize">{priority}</span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Assignee Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 transition-default",
                filters.assigneeId?.length
                  ? "bg-brand-subtle text-brand border border-brand-border"
                  : "hover:bg-ui-bg-hover",
              )}
            >
              Assignee
              {filters.assigneeId?.length ? ` (${filters.assigneeId.length})` : ""}
              <ChevronDown className="ml-1 w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
            {members?.map((member) => (
              <DropdownMenuCheckboxItem
                key={member.userId}
                checked={filters.assigneeId?.includes(member.userId) ?? false}
                onCheckedChange={() => toggleArrayFilter("assigneeId", member.userId)}
              >
                {member.userName}
              </DropdownMenuCheckboxItem>
            ))}
            {(!members || members.length === 0) && (
              <div className="px-2 py-1.5 text-sm text-ui-text-secondary">No members</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Labels Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 transition-default",
                filters.labels?.length
                  ? "bg-brand-subtle text-brand border border-brand-border"
                  : "hover:bg-ui-bg-hover",
              )}
            >
              Labels
              {filters.labels?.length ? ` (${filters.labels.length})` : ""}
              <ChevronDown className="ml-1 w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
            {labels?.map((label) => (
              <DropdownMenuCheckboxItem
                key={label._id}
                checked={filters.labels?.includes(label.name) ?? false}
                onCheckedChange={() => toggleArrayFilter("labels", label.name)}
              >
                <Flex align="center" gap="sm">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </Flex>
              </DropdownMenuCheckboxItem>
            ))}
            {(!labels || labels.length === 0) && (
              <div className="px-2 py-1.5 text-sm text-ui-text-secondary">No labels</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        {hasActiveFilters && <div className="w-px h-6 bg-ui-border" />}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 px-2 text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-hover transition-default"
          >
            <X className="w-4 h-4 mr-1" />
            Clear ({activeFilterCount})
          </Button>
        )}

        {/* Save Filter */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSaveDialog(true)}
            className="h-8 px-3 text-ui-text-secondary hover:text-brand hover:bg-ui-bg-hover transition-default"
          >
            Save Filter
          </Button>
        )}

        {/* Saved Filters */}
        {savedFilters && savedFilters.length > 0 && (
          <>
            <div className="w-px h-6 bg-ui-border" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 hover:bg-ui-bg-hover transition-default"
                >
                  Saved Filters ({savedFilters.length})
                  <ChevronDown className="ml-1 w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="max-h-64 overflow-y-auto min-w-48 scrollbar-subtle"
              >
                {savedFilters.map((filter) => (
                  <Flex
                    key={filter._id}
                    align="center"
                    justify="between"
                    className="px-2 py-1.5 hover:bg-ui-bg-hover rounded cursor-pointer transition-fast group"
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadFilter(filter)}
                      className="flex-1 text-left text-sm text-ui-text group-hover:text-ui-text"
                    >
                      {filter.name}
                      {filter.isPublic && (
                        <span className="ml-1 text-xs text-ui-text-tertiary">(public)</span>
                      )}
                    </button>
                    {filter.isOwner && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteFilter(filter._id);
                        }}
                        className="p-1 text-ui-text-tertiary hover:text-status-error opacity-0 group-hover:opacity-100 transition-fast"
                        aria-label="Delete filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </Flex>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
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
            <Button onClick={() => void handleSaveFilter()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
