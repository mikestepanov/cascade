import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/custom-render";
import { FilterBar } from "./FilterBar";

// Mock ShadcnSelect to use testable native select
vi.mock("./ui/ShadcnSelect", () => {
  // Track items to render in the select
  const items: Array<{ value: string; children: React.ReactNode }> = [];

  return {
    Select: ({
      children,
      onValueChange,
    }: {
      children: React.ReactNode;
      onValueChange: (value: string) => void;
    }) => {
      // Clear and collect items from children
      items.length = 0;

      return (
        <div data-testid="select-root">
          <select
            data-testid="filter-select"
            aria-label="Saved Filters:"
            onChange={(e) => onValueChange(e.target.value)}
          >
            <option value="">Select a filter...</option>
            {children}
          </select>
        </div>
      );
    },
    SelectTrigger: () => null,
    SelectValue: () => null,
    SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
      <option value={value}>{children}</option>
    ),
  };
});

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("FilterBar", () => {
  const mockProjectId = "proj1" as Id<"projects">;
  const mockOnFilterChange = vi.fn();

  const mockSavedFilters = [
    {
      _id: "filter1" as Id<"savedFilters">,
      name: "High Priority",
      filters: { priority: "high" },
      isPublic: true,
      isOwner: true,
      creatorName: "John Doe",
    },
    {
      _id: "filter2" as Id<"savedFilters">,
      name: "My Bugs",
      filters: { type: "bug", assignee: "me" },
      isPublic: false,
      isOwner: true,
      creatorName: "John Doe",
    },
    {
      _id: "filter3" as Id<"savedFilters">,
      name: "Team Filter",
      filters: { status: "in_progress" },
      isPublic: true,
      isOwner: false,
      creatorName: "Jane Smith",
    },
  ];

  const mockCreateFilter = vi.fn();
  const mockRemoveFilter = vi.fn();

  let mutationCallCount = 0;

  beforeEach(() => {
    vi.clearAllMocks();
    mutationCallCount = 0;
    (useQuery as vi.Mock).mockReturnValue(mockSavedFilters);

    // Return mutations alternating between create and remove
    (useMutation as vi.Mock).mockImplementation(() => {
      mutationCallCount++;
      return mutationCallCount % 2 === 1 ? mockCreateFilter : mockRemoveFilter;
    });
  });

  describe("Rendering", () => {
    it("should render saved filters dropdown", () => {
      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      expect(screen.getByLabelText("Saved Filters:")).toBeInTheDocument();
      expect(screen.getByText("Select a filter...")).toBeInTheDocument();
    });

    it("should display all saved filters in dropdown options", () => {
      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      const select = screen.getByTestId("filter-select");
      expect(select).toBeInTheDocument();

      // Check filter names are present in the dropdown (as options)
      const options = select.querySelectorAll("option");
      expect(options.length).toBe(4); // 1 placeholder + 3 filters

      // Verify filter names exist somewhere in the document (they appear in both dropdown and quick filters)
      expect(screen.getAllByText(/High Priority/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/My Bugs/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Team Filter/).length).toBeGreaterThanOrEqual(1);
    });

    it("should render empty state when no saved filters", () => {
      (useQuery as vi.Mock).mockReturnValue([]);

      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      const select = screen.getByTestId("filter-select");
      const options = select.querySelectorAll("option");

      // Should only have "Select a filter..." option
      expect(options.length).toBe(1);
      expect(screen.getByText("Select a filter...")).toBeInTheDocument();
    });

    it("should render loading state when data is undefined", () => {
      (useQuery as vi.Mock).mockReturnValue(undefined);

      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      const select = screen.getByTestId("filter-select");
      expect(select).toBeInTheDocument();
    });
  });

  describe("Filter Selection", () => {
    it("should load filter when selecting from dropdown", async () => {
      const user = userEvent.setup();
      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      const select = screen.getByTestId("filter-select");
      await user.selectOptions(select, "filter1");

      expect(mockOnFilterChange).toHaveBeenCalledWith({ priority: "high" });
      expect(toast.success).toHaveBeenCalledWith("Filter applied");
    });

    it("should load filter when clicking quick filter button", async () => {
      const user = userEvent.setup();
      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      // Find quick filter buttons (in the bottom section)
      const quickFilterButton = screen
        .getAllByRole("button")
        .find((btn) => btn.textContent === "My Bugs");
      expect(quickFilterButton).toBeDefined();

      if (quickFilterButton) {
        await user.click(quickFilterButton);
      }

      expect(mockOnFilterChange).toHaveBeenCalledWith({ type: "bug", assignee: "me" });
      expect(toast.success).toHaveBeenCalledWith("Filter applied");
    });
  });

  describe("Active Filters UI", () => {
    it("should not show save/clear buttons when no active filters", () => {
      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      expect(screen.queryByText("💾 Save Filter")).not.toBeInTheDocument();
      expect(screen.queryByText("✕ Clear")).not.toBeInTheDocument();
      expect(screen.queryByText(/filter\(s\) active/)).not.toBeInTheDocument();
    });

    it("should show save/clear buttons and count when filters are active", async () => {
      const user = userEvent.setup();
      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      // Load a filter to set active filters
      const select = screen.getByTestId("filter-select");
      await user.selectOptions(select, "filter1");

      expect(screen.getByText("💾 Save Filter")).toBeInTheDocument();
      expect(screen.getByText("✕ Clear")).toBeInTheDocument();
      expect(screen.getByText("1 filter(s) active")).toBeInTheDocument();
    });

    it("should display correct active filter count", async () => {
      const user = userEvent.setup();
      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      // Load filter with 1 property
      const select = screen.getByTestId("filter-select");
      await user.selectOptions(select, "filter1");
      expect(screen.getByText("1 filter(s) active")).toBeInTheDocument();

      // Load filter with 2 properties
      await user.selectOptions(select, "filter2");
      expect(screen.getByText("2 filter(s) active")).toBeInTheDocument();
    });

    it("should clear filters when clicking Clear button", async () => {
      const user = userEvent.setup();
      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      // Load a filter first
      const select = screen.getByTestId("filter-select");
      await user.selectOptions(select, "filter1");

      // Click Clear
      const clearButton = screen.getByText("✕ Clear");
      await user.click(clearButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({});
      expect(toast.success).toHaveBeenCalledWith("Filters cleared");
      expect(screen.queryByText("1 filter(s) active")).not.toBeInTheDocument();
    });
  });

  describe("Save Filter Dialog", () => {
    it("should open save dialog when clicking Save Filter button", async () => {
      const user = userEvent.setup();
      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      // Load a filter first
      const select = screen.getByTestId("filter-select");
      await user.selectOptions(select, "filter1");

      // Click Save Filter
      await user.click(screen.getByText("💾 Save Filter"));

      await waitFor(() => {
        expect(screen.getByText("Save Filter")).toBeInTheDocument();
      });
      expect(screen.getByLabelText("Filter Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Share with team (make public)")).toBeInTheDocument();
    });

    it("should close save dialog when clicking Cancel", async () => {
      const user = userEvent.setup();
      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      // Open dialog
      const select = screen.getByTestId("filter-select");
      await user.selectOptions(select, "filter1");
      await user.click(screen.getByText("💾 Save Filter"));

      await waitFor(() => {
        expect(screen.getByText("Save Filter")).toBeInTheDocument();
      });

      // Click Cancel
      await user.click(screen.getByText("Cancel"));

      await waitFor(() => {
        expect(screen.queryByLabelText("Filter Name")).not.toBeInTheDocument();
      });
    });

    it("should validate filter name before saving", async () => {
      const user = userEvent.setup();
      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      // Open dialog
      const select = screen.getByTestId("filter-select");
      await user.selectOptions(select, "filter1");
      await user.click(screen.getByText("💾 Save Filter"));

      await waitFor(() => {
        expect(screen.getByLabelText("Filter Name")).toBeInTheDocument();
      });

      // Try to save without entering a name - find the modal's Save button
      const allButtons = screen.getAllByRole("button");
      const modalSaveButton = allButtons.find(
        (btn) => btn.textContent === "Save" && !btn.textContent?.includes("💾"),
      );
      if (modalSaveButton) {
        await user.click(modalSaveButton);
      }

      expect(toast.error).toHaveBeenCalledWith("Please enter a filter name");
      expect(mockCreateFilter).not.toHaveBeenCalled();
    });

    it("should save filter with name and public flag", async () => {
      const user = userEvent.setup();
      mockCreateFilter.mockResolvedValueOnce({});

      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      // Open dialog
      const select = screen.getByTestId("filter-select");
      await user.selectOptions(select, "filter1");
      await user.click(screen.getByText("💾 Save Filter"));

      await waitFor(() => {
        expect(screen.getByLabelText("Filter Name")).toBeInTheDocument();
      });

      // Enter filter name
      const nameInput = screen.getByLabelText("Filter Name");
      await user.type(nameInput, "My Custom Filter");

      // Check public checkbox
      const publicCheckbox = screen.getByLabelText("Share with team (make public)");
      await user.click(publicCheckbox);

      // Click Save
      const allButtons = screen.getAllByRole("button");
      const modalSaveButton = allButtons.find(
        (btn) => btn.textContent === "Save" && !btn.textContent?.includes("💾"),
      );
      if (modalSaveButton) {
        await user.click(modalSaveButton);
      }

      await waitFor(() => {
        expect(mockCreateFilter).toHaveBeenCalledWith({
          projectId: mockProjectId,
          name: "My Custom Filter",
          filters: { priority: "high" },
          isPublic: true,
        });
      });

      expect(toast.success).toHaveBeenCalledWith("Filter saved");
    });

    it("should handle save filter error", async () => {
      const user = userEvent.setup();
      mockCreateFilter.mockRejectedValueOnce(new Error("Save failed"));

      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      const select = screen.getByTestId("filter-select");
      await user.selectOptions(select, "filter1");
      await user.click(screen.getByText("💾 Save Filter"));

      await waitFor(() => {
        expect(screen.getByLabelText("Filter Name")).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText("Filter Name");
      await user.type(nameInput, "Test");

      const allButtons = screen.getAllByRole("button");
      const modalSaveButton = allButtons.find(
        (btn) => btn.textContent === "Save" && !btn.textContent?.includes("💾"),
      );
      if (modalSaveButton) {
        await user.click(modalSaveButton);
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Save failed");
      });
    });

    it("should reset form fields when save dialog is closed", async () => {
      const user = userEvent.setup();
      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      // Open dialog
      const select = screen.getByTestId("filter-select");
      await user.selectOptions(select, "filter1");
      await user.click(screen.getByText("💾 Save Filter"));

      await waitFor(() => {
        expect(screen.getByLabelText("Filter Name")).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByLabelText("Filter Name");
      await user.type(nameInput, "Test Filter");
      await user.click(screen.getByLabelText("Share with team (make public)"));

      // Cancel
      await user.click(screen.getByText("Cancel"));

      await waitFor(() => {
        expect(screen.queryByLabelText("Filter Name")).not.toBeInTheDocument();
      });

      // Reopen dialog
      await user.click(screen.getByText("💾 Save Filter"));

      await waitFor(() => {
        expect(screen.getByLabelText("Filter Name")).toBeInTheDocument();
      });

      // Fields should be reset
      const reopenedNameInput = screen.getByLabelText("Filter Name");
      const reopenedCheckbox = screen.getByLabelText("Share with team (make public)");

      expect(reopenedNameInput).toHaveValue("");
      expect(reopenedCheckbox).not.toBeChecked();
    });
  });

  describe("Quick Filters", () => {
    it("should display quick filter buttons for saved filters", () => {
      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      // All 3 filters should show as buttons
      const filterButtons = screen.getAllByRole("button").filter((btn) => {
        const text = btn.textContent;
        return text === "High Priority" || text === "My Bugs" || text === "Team Filter";
      });

      expect(filterButtons.length).toBeGreaterThanOrEqual(3);
    });

    it("should show delete button only for owned filters", () => {
      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      // Get all delete buttons
      const deleteButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.getAttribute("aria-label") === "Delete filter");

      // Should have 2 delete buttons (filter1 and filter2 are owned)
      expect(deleteButtons.length).toBe(2);
    });

    it("should delete filter when clicking delete button", async () => {
      const user = userEvent.setup();
      mockRemoveFilter.mockResolvedValue({});

      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      // Find delete button for first filter
      const deleteButtons = screen.getAllByLabelText("Delete filter");
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockRemoveFilter).toHaveBeenCalledWith({ id: "filter1" });
      });

      expect(toast.success).toHaveBeenCalledWith("Filter deleted");
    });

    it("should handle delete filter error", async () => {
      const user = userEvent.setup();
      mockRemoveFilter.mockRejectedValue(new Error("Delete failed"));

      render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

      const deleteButtons = screen.getAllByLabelText("Delete filter");
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Delete failed");
      });
    });

    it("should limit quick filters to 5", () => {
      // Create 10 filters
      const manyFilters = Array.from({ length: 10 }, (_, i) => ({
        _id: `filter${i}` as Id<"savedFilters">,
        name: `Filter ${i}`,
        filters: { test: i },
        isPublic: false,
        isOwner: true,
        creatorName: "Test User",
      }));

      (useQuery as vi.Mock).mockReturnValue(manyFilters);

      const { container } = render(
        <FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />,
      );

      // Quick filter section should only show 5 filters
      const quickFilterSection = container.querySelector(".mt-3.flex.flex-wrap");
      const quickFilterDivs = quickFilterSection?.querySelectorAll(
        ".inline-flex.items-center.gap-2.px-3.py-1",
      );

      expect(quickFilterDivs?.length).toBe(5);
    });
  });
});
