import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useQuery } from "convex/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GlobalSearch } from "./GlobalSearch";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

describe("GlobalSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useQuery as vi.Mock).mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render search button", () => {
    render(<GlobalSearch />);

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText(/⌘K/i)).toBeInTheDocument();
  });

  it("should open modal when search button is clicked", async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByPlaceholderText(/Search issues, documents/i)).toBeInTheDocument();
  });

  it("should open modal when Cmd+K is pressed", async () => {
    render(<GlobalSearch />);

    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search issues, documents/i)).toBeInTheDocument();
    });
  });

  it("should open modal when Ctrl+K is pressed", async () => {
    render(<GlobalSearch />);

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search issues, documents/i)).toBeInTheDocument();
    });
  });

  it("should not open on other keyboard shortcuts", () => {
    render(<GlobalSearch />);

    const event = new KeyboardEvent("keydown", {
      key: "s",
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(screen.queryByPlaceholderText(/Search issues, documents/i)).not.toBeInTheDocument();
  });

  it("should show all tabs: All, Issues, Documents", async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Issues")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
  });

  it("should filter by tab selection", async () => {
    const user = userEvent.setup();
    const mockIssues = [{ _id: "1", key: "TEST-1", title: "Test Issue", type: "task" }];
    const mockDocuments = [{ _id: "2", title: "Test Doc" }];

    (useQuery as vi.Mock).mockImplementation((queryFn: any) => {
      if (queryFn.toString().includes("issues")) return mockIssues;
      if (queryFn.toString().includes("documents")) return mockDocuments;
      return [];
    });

    render(<GlobalSearch />);

    const button = screen.getByRole("button");
    await user.click(button);

    const searchInput = screen.getByPlaceholderText(/Search issues, documents/i);
    await user.type(searchInput, "test");

    // Click Issues tab
    const issuesTab = screen.getByText("Issues");
    await user.click(issuesTab);

    await waitFor(() => {
      expect(screen.getByText("TEST-1")).toBeInTheDocument();
      expect(screen.queryByText("Test Doc")).not.toBeInTheDocument();
    });

    // Click Documents tab
    const documentsTab = screen.getByText("Documents");
    await user.click(documentsTab);

    await waitFor(() => {
      expect(screen.queryByText("TEST-1")).not.toBeInTheDocument();
      expect(screen.getByText("Test Doc")).toBeInTheDocument();
    });
  });

  it("should debounce search input", async () => {
    const user = userEvent.setup();
    vi.useFakeTimers();

    render(<GlobalSearch />);

    const button = screen.getByRole("button");
    await user.click(button);

    const searchInput = screen.getByPlaceholderText(/Search issues, documents/i);
    await user.type(searchInput, "test");

    // Query should not be called immediately
    expect(useQuery).toHaveBeenCalledWith(expect.anything(), "skip");

    // Fast-forward time
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(useQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ query: "test" }),
      );
    });

    vi.useRealTimers();
  });

  it("should show empty state when query is empty", async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByText(/Start typing to search/i)).toBeInTheDocument();
  });

  it("should show empty state when no results found", async () => {
    const user = userEvent.setup();
    (useQuery as vi.Mock).mockReturnValue([]);

    render(<GlobalSearch />);

    const button = screen.getByRole("button");
    await user.click(button);

    const searchInput = screen.getByPlaceholderText(/Search issues, documents/i);
    await user.type(searchInput, "nonexistent");

    await waitFor(() => {
      expect(screen.getByText(/No results found/i)).toBeInTheDocument();
    });
  });

  it("should display issue results with correct metadata", async () => {
    const user = userEvent.setup();
    const mockIssues = [
      {
        _id: "1",
        key: "PROJ-123",
        title: "Fix authentication bug",
        type: "bug",
        status: "in-progress",
        project: { name: "My Project" },
      },
    ];

    (useQuery as vi.Mock).mockImplementation((queryFn: any) => {
      if (queryFn.toString().includes("issues")) return mockIssues;
      return [];
    });

    render(<GlobalSearch />);

    const button = screen.getByRole("button");
    await user.click(button);

    const searchInput = screen.getByPlaceholderText(/Search issues, documents/i);
    await user.type(searchInput, "auth");

    await waitFor(() => {
      expect(screen.getByText("PROJ-123")).toBeInTheDocument();
      expect(screen.getByText(/Fix authentication bug/i)).toBeInTheDocument();
      expect(screen.getByText("🐛")).toBeInTheDocument(); // Bug icon
    });
  });

  it("should display document results", async () => {
    const user = userEvent.setup();
    const mockDocuments = [
      {
        _id: "1",
        title: "API Documentation",
        project: { name: "Backend" },
      },
    ];

    (useQuery as vi.Mock).mockImplementation((queryFn: any) => {
      if (queryFn.toString().includes("documents")) return mockDocuments;
      return [];
    });

    render(<GlobalSearch />);

    const button = screen.getByRole("button");
    await user.click(button);

    const searchInput = screen.getByPlaceholderText(/Search issues, documents/i);
    await user.type(searchInput, "api");

    await waitFor(() => {
      expect(screen.getByText(/API Documentation/i)).toBeInTheDocument();
      expect(screen.getByText("📄")).toBeInTheDocument(); // Document icon
    });
  });

  it("should close modal when backdrop is clicked", async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByPlaceholderText(/Search issues, documents/i)).toBeInTheDocument();

    const backdrop = screen
      .getByPlaceholderText(/Search issues, documents/i)
      .closest("[role='dialog']")?.previousSibling as HTMLElement;

    if (backdrop) {
      await user.click(backdrop);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/Search issues, documents/i)).not.toBeInTheDocument();
      });
    }
  });

  it("should close modal when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);

    const button = screen.getByRole("button");
    await user.click(button);

    const searchInput = screen.getByPlaceholderText(/Search issues, documents/i);
    expect(searchInput).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Search issues, documents/i)).not.toBeInTheDocument();
    });
  });

  it("should show result count", async () => {
    const user = userEvent.setup();
    const mockIssues = [
      { _id: "1", key: "TEST-1", title: "Issue 1", type: "task" },
      { _id: "2", key: "TEST-2", title: "Issue 2", type: "bug" },
      { _id: "3", key: "TEST-3", title: "Issue 3", type: "story" },
    ];

    (useQuery as vi.Mock).mockImplementation((queryFn: any) => {
      if (queryFn.toString().includes("issues")) return mockIssues;
      return [];
    });

    render(<GlobalSearch />);

    const button = screen.getByRole("button");
    await user.click(button);

    const searchInput = screen.getByPlaceholderText(/Search issues, documents/i);
    await user.type(searchInput, "test");

    await waitFor(() => {
      expect(screen.getByText(/3 results/i)).toBeInTheDocument();
    });
  });

  it("should navigate to issue when result is clicked", async () => {
    const user = userEvent.setup();
    const mockIssues = [
      {
        _id: "issue-1",
        key: "TEST-1",
        title: "Test Issue",
        type: "task",
        projectId: "proj-1",
      },
    ];

    (useQuery as vi.Mock).mockImplementation((queryFn: any) => {
      if (queryFn.toString().includes("issues")) return mockIssues;
      return [];
    });

    // Mock window.location
    vi.stubGlobal("location", { href: "" });

    render(<GlobalSearch />);

    const button = screen.getByRole("button");
    await user.click(button);

    const searchInput = screen.getByPlaceholderText(/Search issues, documents/i);
    await user.type(searchInput, "test");

    await waitFor(async () => {
      const result = screen.getByText("TEST-1");
      await user.click(result);

      // Modal should close after navigation
      expect(screen.queryByPlaceholderText(/Search issues, documents/i)).not.toBeInTheDocument();
    });
  });
});
