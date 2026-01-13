/**
 * Example: Assignee Search Dropdown with Fuzzy Matching
 *
 * Shows how to integrate useFuzzySearch with Convex queries
 * for a real-world use case.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useUserFuzzySearch } from "@/hooks/useFuzzySearch";
import { Avatar } from "../ui/Avatar";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";
import { FuzzySearchInput, HighlightedText } from "./FuzzySearchInput";

interface AssigneeSearchDropdownProps {
  /**
   * Project ID to get members from
   */
  projectId: Id<"projects">;

  /**
   * Currently selected assignee (optional)
   */
  value?: Id<"users"> | null;

  /**
   * Called when assignee is selected
   */
  onChange: (assigneeId: Id<"users"> | null) => void;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * CSS classes
   */
  className?: string;
}

export function AssigneeSearchDropdown({
  projectId,
  value,
  onChange,
  placeholder = "Search assignee...",
  className = "",
}: AssigneeSearchDropdownProps) {
  // Step 1: Load members from Convex (permission-filtered)
  const members = useQuery(api.projectMembers.list, { projectId });

  // Step 2: Apply fuzzy search on loaded data
  const { results, search, query, clear, isDebouncing } = useUserFuzzySearch(members);

  // Get selected user details
  const selectedUser = members?.find((m: any) => m._id === value);

  if (!members) {
    return (
      <div className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
        Loading members...
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Show selected user */}
      {selectedUser && !query && (
        <div className="flex items-center justify-between p-2 border border-ui-border-secondary dark:border-ui-border-secondary-dark rounded-lg mb-2">
          <Flex gap="sm" align="center">
            <Avatar name={selectedUser.name} email={selectedUser.email} size="sm" />
            <span className="text-sm">{selectedUser.name || selectedUser.email}</span>
          </Flex>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-ui-text-tertiary hover:text-status-error"
            aria-label="Clear assignee"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>Clear</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Fuzzy search input */}
      <FuzzySearchInput
        results={results}
        query={query}
        onSearch={search}
        onSelect={(user: any) => {
          onChange(user._id);
          clear();
        }}
        onClear={() => onChange(null)}
        getKey={(user: any) => user._id}
        placeholder={placeholder}
        showScore={false}
        isLoading={isDebouncing}
        aria-label="Search for assignee"
        renderItem={({ item: user, matches }) => {
          // Find the match for highlighting
          const nameMatch = matches?.find((m) => m.key === "name");

          return (
            <Flex gap="sm" align="center">
              <Avatar name={user.name} email={user.email} size="md" />
              <div>
                <div className="text-sm font-medium">
                  {nameMatch ? (
                    <HighlightedText text={user.name || "Unknown"} matches={nameMatch.indices} />
                  ) : (
                    user.name || "Unknown"
                  )}
                </div>
                {user.email && (
                  <div className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                    {user.email}
                  </div>
                )}
              </div>
            </Flex>
          );
        }}
      />

      {/* Helper text */}
      <Typography variant="muted" size="xs" className="mt-1">
        Search by name or email • Supports typos
      </Typography>
    </div>
  );
}

/**
 * Usage Example:
 *
 * ```tsx
 * function CreateIssueModal({ projectId }) {
 *   const [assigneeId, setAssigneeId] = useState<Id<"users"> | null>(null);
 *
 *   return (
 *     <div>
 *       <label>Assignee</label>
 *       <AssigneeSearchDropdown
 *         projectId={projectId}
 *         value={assigneeId}
 *         onChange={setAssigneeId}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
