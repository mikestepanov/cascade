import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import { FilterBar } from "./FilterBar";

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

import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;
const mockUseMutation = useMutation as ReturnType<typeof vi.fn>;

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
    mutationCallCount = 0; // Reset counter for each test
    mockUseQuery.mockReturnValue(mockSavedFilters);

    // Return mutations alternating between create and remove
    // This works even when component re-renders because we cycle through
    mockUseMutation.mockImplementation(() => {
      mutationCallCount++;
      // Odd calls return createFilter, even calls return removeFilter
      return mutationCallCount % 2 === 1 ? mockCreateFilter : mockRemoveFilter;
    });
  });

  it("should render saved filters dropdown", () => {
    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    expect(screen.getByLabelText("Saved Filters:")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Select a filter...")).toBeInTheDocument();
  });

  it("should display all saved filters in dropdown", () => {
    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    // Check dropdown options specifically
    const dropdown = screen.getByRole("combobox");
    expect(dropdown).toHaveTextContent("High Priority");
    expect(dropdown).toHaveTextContent("(Public)");
    expect(dropdown).toHaveTextContent("My Bugs");
    expect(dropdown).toHaveTextContent("Team Filter");
    expect(dropdown).toHaveTextContent("by Jane Smith");
  });

  it("should load filter when selecting from dropdown", async () => {
    const user = userEvent.setup();
    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    const dropdown = screen.getByRole("combobox");
    await user.selectOptions(dropdown, "filter1");

    expect(mockOnFilterChange).toHaveBeenCalledWith({ priority: "high" });
    expect(toast.success).toHaveBeenCalledWith("Filter applied");
  });

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
    const dropdown = screen.getByRole("combobox");
    await user.selectOptions(dropdown, "filter1");

    expect(screen.getByText("💾 Save Filter")).toBeInTheDocument();
    expect(screen.getByText("✕ Clear")).toBeInTheDocument();
    expect(screen.getByText("1 filter(s) active")).toBeInTheDocument();
  });

  it("should open save dialog when clicking Save Filter button", async () => {
    const user = userEvent.setup();
    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    // Load a filter first
    await user.selectOptions(screen.getByRole("combobox"), "filter1");

    // Click Save Filter
    const saveButton = screen.getByText("💾 Save Filter");
    await user.click(saveButton);

    expect(screen.getByText("Save Filter")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Share with team (make public)")).toBeInTheDocument();
  });

  it("should close save dialog when clicking Cancel", async () => {
    const user = userEvent.setup();
    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    // Open dialog
    await user.selectOptions(screen.getByRole("combobox"), "filter1");
    await user.click(screen.getByText("💾 Save Filter"));

    // Click Cancel
    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    expect(screen.queryByText("Save Filter")).not.toBeInTheDocument();
  });

  it("should validate filter name before saving", async () => {
    const user = userEvent.setup();
    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    // Open dialog
    await user.selectOptions(screen.getByRole("combobox"), "filter1");
    await user.click(screen.getByText("💾 Save Filter"));

    // Try to save without entering a name
    const saveButton = screen.getAllByText("Save").find((btn) => btn.tagName === "BUTTON");
    if (saveButton) {
      await user.click(saveButton);
    }

    expect(toast.error).toHaveBeenCalledWith("Please enter a filter name");
    expect(mockCreateFilter).not.toHaveBeenCalled();
  });

  it("should save filter with name and public flag", async () => {
    const user = userEvent.setup();
    mockCreateFilter.mockResolvedValueOnce({});

    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    // Open dialog
    await user.selectOptions(screen.getByRole("combobox"), "filter1");
    await user.click(screen.getByText("💾 Save Filter"));

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText("Save Filter")).toBeInTheDocument();
    });

    // Enter filter name
    const nameInput = screen.getByLabelText("Filter Name");
    await user.type(nameInput, "My Custom Filter");

    // Check public checkbox
    const publicCheckbox = screen.getByLabelText("Share with team (make public)");
    await user.click(publicCheckbox);

    // Click Save - find buttons and click the one that says just "Save" (not "💾 Save Filter")
    const allButtons = screen.getAllByRole("button");
    const modalSaveButton = allButtons.find(
      (btn) => btn.textContent === "Save" && !btn.textContent.includes("💾"),
    );
    expect(modalSaveButton).toBeDefined();
    if (modalSaveButton) {
      await user.click(modalSaveButton);
    }

    await waitFor(
      () => {
        expect(mockCreateFilter).toHaveBeenCalledWith({
          projectId: mockProjectId,
          name: "My Custom Filter",
          filters: { priority: "high" },
          isPublic: true,
        });
      },
      { timeout: 2000 },
    );

    expect(toast.success).toHaveBeenCalledWith("Filter saved");
  });

  it("should handle save filter error", async () => {
    const user = userEvent.setup();
    mockCreateFilter.mockRejectedValueOnce(new Error("Save failed"));

    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    await user.selectOptions(screen.getByRole("combobox"), "filter1");
    await user.click(screen.getByText("💾 Save Filter"));

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText("Save Filter")).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText("Filter Name");
    await user.type(nameInput, "Test");

    // Find the modal Save button (not the "💾 Save Filter" button)
    const allButtons = screen.getAllByRole("button");
    const modalSaveButton = allButtons.find(
      (btn) => btn.textContent === "Save" && !btn.textContent.includes("💾"),
    );
    expect(modalSaveButton).toBeDefined();
    if (modalSaveButton) {
      await user.click(modalSaveButton);
    }

    await waitFor(
      () => {
        expect(toast.error).toHaveBeenCalledWith("Save failed");
      },
      { timeout: 2000 },
    );
  });

  it("should clear filters when clicking Clear button", async () => {
    const user = userEvent.setup();
    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    // Load a filter first
    await user.selectOptions(screen.getByRole("combobox"), "filter1");

    // Click Clear
    const clearButton = screen.getByText("✕ Clear");
    await user.click(clearButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({});
    expect(toast.success).toHaveBeenCalledWith("Filters cleared");
    expect(screen.queryByText("1 filter(s) active")).not.toBeInTheDocument();
  });

  it("should display quick filter buttons (first 5 filters)", () => {
    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    // All 3 filters should show as buttons (less than 5)
    const filterButtons = screen.getAllByRole("button").filter((btn) => {
      return (
        btn.textContent === "High Priority" ||
        btn.textContent === "My Bugs" ||
        btn.textContent === "Team Filter"
      );
    });

    expect(filterButtons.length).toBeGreaterThanOrEqual(3);
  });

  it("should load filter when clicking quick filter button", async () => {
    const user = userEvent.setup();
    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    // Get all buttons with "My Bugs" text and find the quick filter one (not in dropdown)
    const quickFilterButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent === "My Bugs");
    const quickFilterButton = quickFilterButtons[0]; // First one should be the quick filter
    await user.click(quickFilterButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({ type: "bug", assignee: "me" });
    expect(toast.success).toHaveBeenCalledWith("Filter applied");
  });

  it("should show delete button only for owned filters", () => {
    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    // Get all delete buttons (✕)
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

    // Find delete button for "High Priority" filter
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

  it("should render empty state when no saved filters", () => {
    mockUseQuery.mockReturnValue([]);

    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    const dropdown = screen.getByRole("combobox");
    const options = dropdown.querySelectorAll("option");

    // Should only have "Select a filter..." option
    expect(options.length).toBe(1);
    expect(screen.getByText("Select a filter...")).toBeInTheDocument();
  });

  it("should render loading state when data is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    const dropdown = screen.getByRole("combobox");
    expect(dropdown).toBeInTheDocument();
  });

  it("should reset form fields when save dialog is closed", async () => {
    const user = userEvent.setup();
    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    // Open dialog
    await user.selectOptions(screen.getByRole("combobox"), "filter1");
    await user.click(screen.getByText("💾 Save Filter"));

    // Fill form
    const nameInput = screen.getByLabelText("Filter Name");
    await user.type(nameInput, "Test Filter");
    await user.click(screen.getByLabelText("Share with team (make public)"));

    // Cancel
    await user.click(screen.getByText("Cancel"));

    // Reopen dialog
    await user.click(screen.getByText("💾 Save Filter"));

    // Fields should be reset
    const reopenedNameInput = screen.getByLabelText("Filter Name");
    const reopenedCheckbox = screen.getByLabelText("Share with team (make public)");

    expect(reopenedNameInput).toHaveValue("");
    expect(reopenedCheckbox).not.toBeChecked();
  });

  it("should display correct active filter count", async () => {
    const user = userEvent.setup();
    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    // Load filter with 1 property
    await user.selectOptions(screen.getByRole("combobox"), "filter1");
    expect(screen.getByText("1 filter(s) active")).toBeInTheDocument();

    // Load filter with 2 properties
    await user.selectOptions(screen.getByRole("combobox"), "filter2");
    expect(screen.getByText("2 filter(s) active")).toBeInTheDocument();
  });

  it("should have accessible labels and roles", () => {
    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    expect(screen.getByLabelText("Saved Filters:")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should close save dialog when clicking backdrop", async () => {
    const user = userEvent.setup();
    render(<FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />);

    // Open dialog
    await user.selectOptions(screen.getByRole("combobox"), "filter1");
    await user.click(screen.getByText("💾 Save Filter"));

    expect(screen.getByText("Save Filter")).toBeInTheDocument();

    // Find and click the backdrop
    // The ModalBackdrop component creates a div that covers the screen
    const backdrop = document.querySelector(".fixed.inset-0.bg-black");
    if (backdrop) {
      await user.click(backdrop as HTMLElement);
      await waitFor(() => {
        expect(screen.queryByText("Save Filter")).not.toBeInTheDocument();
      });
    }
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

    mockUseQuery.mockReturnValue(manyFilters);

    const { container } = render(
      <FilterBar projectId={mockProjectId} onFilterChange={mockOnFilterChange} />,
    );

    // Quick filter section should only show 5 filters
    // Each filter is a div with these classes
    const quickFilterSection = container.querySelector(".mt-3.flex.flex-wrap");
    const quickFilterDivs = quickFilterSection?.querySelectorAll(
      ".inline-flex.items-center.gap-2.px-3.py-1",
    );

    expect(quickFilterDivs?.length).toBe(5);
  });
});
