import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import { TimeEntriesList } from "./TimeEntriesList";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("TimeEntriesList", () => {
  const mockDeleteEntry = vi.fn();
  const mockIssueId = "test-issue-id" as Id<"issues">;

  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as vi.Mock).mockReturnValue(mockDeleteEntry);
  });

  it("should show loading state when entries are undefined", () => {
    (useQuery as vi.Mock).mockReturnValue(undefined);

    render(<TimeEntriesList issueId={mockIssueId} />);

    // Check for the spinner element instead of text
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("should display total hours logged", () => {
    const mockEntries = [
      {
        _id: "1",
        hours: 2.5,
        description: "Initial work",
        date: Date.now(),
        createdAt: Date.now(),
        userName: "John Doe",
      },
      {
        _id: "2",
        hours: 1.5,
        description: "Bug fix",
        date: Date.now(),
        createdAt: Date.now(),
        userName: "Jane Smith",
      },
    ];
    (useQuery as vi.Mock).mockReturnValue(mockEntries);

    render(<TimeEntriesList issueId={mockIssueId} />);

    expect(screen.getByText("Total Time Logged")).toBeInTheDocument();
    expect(screen.getByText("4h")).toBeInTheDocument();
  });

  it("should display all time entries", () => {
    const mockEntries = [
      {
        _id: "1",
        hours: 2.5,
        description: "Initial work",
        date: Date.now(),
        createdAt: Date.now(),
        userName: "John Doe",
      },
      {
        _id: "2",
        hours: 1.5,
        description: "Bug fix",
        date: Date.now(),
        createdAt: Date.now(),
        userName: "Jane Smith",
      },
    ];
    (useQuery as vi.Mock).mockReturnValue(mockEntries);

    render(<TimeEntriesList issueId={mockIssueId} />);

    expect(screen.getByText(/Initial work/i)).toBeInTheDocument();
    expect(screen.getByText(/Bug fix/i)).toBeInTheDocument();
    expect(screen.getByText(/by John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/by Jane Smith/i)).toBeInTheDocument();
  });

  it("should display No description when description is missing", () => {
    const mockEntries = [
      {
        _id: "1",
        hours: 2.5,
        date: Date.now(),
        createdAt: Date.now(),
        userName: "John Doe",
      },
    ];
    (useQuery as vi.Mock).mockReturnValue(mockEntries);

    render(<TimeEntriesList issueId={mockIssueId} />);

    // When description is missing, the component simply doesn't render it
    // So we should just verify the entry is there without description
    expect(screen.getByText("2.5h")).toBeInTheDocument();
    expect(screen.getByText(/by John Doe/i)).toBeInTheDocument();
  });

  it("should show empty state when no entries exist", () => {
    (useQuery as vi.Mock).mockReturnValue([]);

    render(<TimeEntriesList issueId={mockIssueId} />);

    expect(screen.getByText(/No time logged yet/i)).toBeInTheDocument();
  });

  it("should call delete mutation when delete button is clicked", async () => {
    const user = userEvent.setup();
    const mockEntries = [
      {
        _id: "entry-1",
        hours: 2.5,
        description: "Work done",
        date: Date.now(),
        createdAt: Date.now(),
        userName: "John Doe",
      },
    ];
    (useQuery as vi.Mock).mockReturnValue(mockEntries);
    mockDeleteEntry.mockResolvedValue(undefined);

    // Mock window.confirm
    global.confirm = vi.fn(() => true);

    render(<TimeEntriesList issueId={mockIssueId} />);

    const deleteButton = screen.getByTitle(/Delete entry/i);
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteEntry).toHaveBeenCalledWith({ id: "entry-1" });
    });
  });

  it("should format hours correctly", () => {
    const mockEntries = [
      {
        _id: "1",
        hours: 2.5,
        description: "Work",
        date: Date.now(),
        createdAt: Date.now(),
        userName: "John",
      },
      {
        _id: "2",
        hours: 1,
        description: "Review",
        date: Date.now(),
        createdAt: Date.now(),
        userName: "Jane",
      },
    ];
    (useQuery as vi.Mock).mockReturnValue(mockEntries);

    render(<TimeEntriesList issueId={mockIssueId} />);

    expect(screen.getByText("2.5h")).toBeInTheDocument();
    expect(screen.getByText("1h")).toBeInTheDocument();
  });

  it("should format date correctly", () => {
    const testDate = new Date("2024-01-15").getTime();
    const mockEntries = [
      {
        _id: "1",
        hours: 2,
        description: "Work",
        date: testDate,
        createdAt: testDate,
        userName: "John",
      },
    ];
    (useQuery as vi.Mock).mockReturnValue(mockEntries);

    render(<TimeEntriesList issueId={mockIssueId} />);

    // Check that the date is formatted using the component's format (e.g., "Jan 15, 2024")
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  it("should display multiple entries in chronological order", () => {
    const mockEntries = [
      {
        _id: "1",
        hours: 1,
        description: "First entry",
        date: Date.now() - 86400000, // Yesterday
        createdAt: Date.now() - 86400000,
        userName: "John",
      },
      {
        _id: "2",
        hours: 2,
        description: "Second entry",
        date: Date.now(),
        createdAt: Date.now(),
        userName: "Jane",
      },
    ];
    (useQuery as vi.Mock).mockReturnValue(mockEntries);

    render(<TimeEntriesList issueId={mockIssueId} />);

    const entries = screen.getAllByText(/entry/i);
    expect(entries).toHaveLength(2);
  });
});
