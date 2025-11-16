import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationCenter } from "./NotificationCenter";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// Mock accessibility utilities
vi.mock("@/lib/accessibility", () => ({
  handleKeyboardClick: vi.fn((callback) => callback),
}));

describe("NotificationCenter", () => {
  const mockMarkAsRead = vi.fn();
  const mockMarkAllAsRead = vi.fn();
  const mockRemove = vi.fn();
  let queryCallCount = 0;
  let mutationCallCount = 0;

  beforeEach(() => {
    queryCallCount = 0;
    mutationCallCount = 0;
    mockMarkAsRead.mockReset();
    mockMarkAllAsRead.mockReset();
    mockRemove.mockReset();

    // Set up mutation mocks to persist across re-renders
    (useMutation as vi.Mock).mockImplementation(() => {
      mutationCallCount++;
      if (mutationCallCount % 3 === 1) return mockMarkAsRead; // 1st, 4th, 7th calls
      if (mutationCallCount % 3 === 2) return mockMarkAllAsRead; // 2nd, 5th, 8th calls
      return mockRemove; // 3rd, 6th, 9th calls
    });

    // Default mock for useQuery
    (useQuery as vi.Mock).mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render notification bell button", () => {
    (useQuery as vi.Mock).mockReturnValue(undefined);

    render(<NotificationCenter />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should show unread count badge when there are unread notifications", () => {
    // Component calls useQuery twice: first for notifications list, second for unread count
    (useQuery as vi.Mock).mockImplementation(() => {
      queryCallCount++;
      if (queryCallCount % 2 === 1) return []; // Odd calls = notifications list
      return 5; // Even calls = unread count
    });

    render(<NotificationCenter />);

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should not show badge when unread count is 0", () => {
    (useQuery as vi.Mock).mockImplementation(() => {
      queryCallCount++;
      if (queryCallCount % 2 === 1) return []; // Odd calls = notifications list
      return 0; // Even calls = unread count
    });

    render(<NotificationCenter />);

    // Badge should not be visible at all when count is 0
    const badge = document.querySelector(".bg-red-500");
    expect(badge).not.toBeInTheDocument();
  });

  it("should show 99+ when unread count exceeds 99", () => {
    (useQuery as vi.Mock).mockImplementation(() => {
      queryCallCount++;
      if (queryCallCount % 2 === 1) return []; // Odd calls = notifications list
      return 150; // Even calls = unread count
    });

    render(<NotificationCenter />);

    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("should open dropdown when bell is clicked", async () => {
    const user = userEvent.setup();
    (useQuery as vi.Mock).mockImplementation(() => {
      queryCallCount++;
      if (queryCallCount % 2 === 1) return []; // Odd calls = notifications list
      return 0; // Even calls = unread count
    });

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByRole("heading", { name: /Notifications/i })).toBeInTheDocument();
  });

  it("should show empty state when no notifications", async () => {
    const user = userEvent.setup();
    (useQuery as vi.Mock).mockImplementation(() => {
      queryCallCount++;
      if (queryCallCount % 2 === 1) return []; // Odd calls = notifications list
      return 0; // Even calls = unread count
    });

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByText(/No notifications/i)).toBeInTheDocument();
  });

  it("should display notification list", async () => {
    const user = userEvent.setup();
    const mockNotifications = [
      {
        _id: "1",
        type: "issue_assigned",
        title: "Issue assigned",
        message: "You were assigned to TEST-123",
        isRead: false,
        createdAt: Date.now(),
      },
      {
        _id: "2",
        type: "issue_commented",
        title: "New comment",
        message: "Someone commented on your issue",
        isRead: true,
        createdAt: Date.now() - 3600000,
      },
    ];
    (useQuery as vi.Mock).mockImplementation(() => {
      queryCallCount++;
      if (queryCallCount % 2 === 1) return mockNotifications; // Odd calls = notifications list
      return 1; // Even calls = unread count
    });

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByText("Issue assigned")).toBeInTheDocument();
    expect(screen.getByText("New comment")).toBeInTheDocument();
    expect(screen.getByText("You were assigned to TEST-123")).toBeInTheDocument();
    expect(screen.getByText("Someone commented on your issue")).toBeInTheDocument();
  });

  it("should highlight unread notifications", async () => {
    const user = userEvent.setup();
    const mockNotifications = [
      {
        _id: "1",
        type: "issue_assigned",
        title: "Unread",
        message: "Test",
        isRead: false,
        createdAt: Date.now(),
      },
    ];
    (useQuery as vi.Mock).mockImplementation(() => {
      queryCallCount++;
      if (queryCallCount % 2 === 1) return mockNotifications; // Odd calls = notifications list
      return 1; // Even calls = unread count
    });

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    // Find the notification container by traversing up from the title
    const titleElement = screen.getByText("Unread");
    // The notification div is a few levels up - it has the bg-blue-50 class
    const notificationDiv = titleElement.closest(".bg-blue-50");
    expect(notificationDiv).toBeInTheDocument();
  });

  it("should call markAsRead when mark as read button is clicked", async () => {
    const user = userEvent.setup();
    const mockNotifications = [
      {
        _id: "notif-1",
        type: "issue_assigned",
        title: "Test",
        message: "Message",
        isRead: false,
        createdAt: Date.now(),
      },
    ];
    (useQuery as vi.Mock).mockImplementation(() => {
      queryCallCount++;
      if (queryCallCount % 2 === 1) return mockNotifications; // Odd calls = notifications list
      return 1; // Even calls = unread count
    });
    mockMarkAsRead.mockResolvedValue(undefined);

    render(<NotificationCenter />);

    const bellButton = screen.getByRole("button");
    await user.click(bellButton);

    const markReadButton = screen.getByTitle("Mark as read");
    await user.click(markReadButton);

    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith({ id: "notif-1" });
    });
  });

  it("should call markAllAsRead when mark all read button is clicked", async () => {
    const user = userEvent.setup();
    const mockNotifications = [
      {
        _id: "1",
        type: "issue_assigned",
        title: "Test",
        message: "Message",
        isRead: false,
        createdAt: Date.now(),
      },
    ];
    (useQuery as vi.Mock).mockImplementation(() => {
      queryCallCount++;
      if (queryCallCount % 2 === 1) return mockNotifications; // Odd calls = notifications list
      return 1; // Even calls = unread count
    });
    mockMarkAllAsRead.mockResolvedValue(undefined);

    render(<NotificationCenter />);

    const bellButton = screen.getByRole("button");
    await user.click(bellButton);

    const markAllButton = screen.getByText("Mark all read");
    await user.click(markAllButton);

    await waitFor(() => {
      expect(mockMarkAllAsRead).toHaveBeenCalledWith({});
    });
  });

  it("should call remove when delete button is clicked", async () => {
    const user = userEvent.setup();
    const mockNotifications = [
      {
        _id: "notif-2",
        type: "issue_assigned",
        title: "Test",
        message: "Message",
        isRead: true,
        createdAt: Date.now(),
      },
    ];
    (useQuery as vi.Mock).mockImplementation(() => {
      queryCallCount++;
      if (queryCallCount % 2 === 1) return mockNotifications; // Odd calls = notifications list
      return 0; // Even calls = unread count
    });
    mockRemove.mockResolvedValue(undefined);

    render(<NotificationCenter />);

    const bellButton = screen.getByRole("button");
    await user.click(bellButton);

    const deleteButton = screen.getByTitle("Delete");
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith({ id: "notif-2" });
    });
  });

  it("should format time correctly", async () => {
    const user = userEvent.setup();
    const now = Date.now();
    const mockNotifications = [
      {
        _id: "1",
        type: "issue_assigned",
        title: "Notification 1",
        message: "Test",
        isRead: false,
        createdAt: now,
      },
      {
        _id: "2",
        type: "issue_assigned",
        title: "Notification 2",
        message: "Test",
        isRead: false,
        createdAt: now - 5 * 60 * 1000, // 5 minutes
      },
      {
        _id: "3",
        type: "issue_assigned",
        title: "Notification 3",
        message: "Test",
        isRead: false,
        createdAt: now - 2 * 60 * 60 * 1000, // 2 hours
      },
    ];
    (useQuery as vi.Mock).mockImplementation(() => {
      queryCallCount++;
      if (queryCallCount % 2 === 1) return mockNotifications; // Odd calls = notifications list
      return 3; // Even calls = unread count
    });

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Notification 1")).toBeInTheDocument();
    });

    expect(screen.getByText("Just now")).toBeInTheDocument();
    expect(screen.getByText("5m ago")).toBeInTheDocument();
    expect(screen.getByText("2h ago")).toBeInTheDocument();
  });

  it("should show correct icon for notification type", async () => {
    const user = userEvent.setup();
    const mockNotifications = [
      {
        _id: "1",
        type: "issue_assigned",
        title: "Assigned",
        message: "Test",
        isRead: false,
        createdAt: Date.now(),
      },
      {
        _id: "2",
        type: "sprint_started",
        title: "Sprint",
        message: "Test",
        isRead: false,
        createdAt: Date.now(),
      },
    ];
    (useQuery as vi.Mock).mockImplementation(() => {
      queryCallCount++;
      if (queryCallCount % 2 === 1) return mockNotifications; // Odd calls = notifications list
      return 2; // Even calls = unread count
    });

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Assigned")).toBeInTheDocument();
    });

    // Check that icons are rendered (emojis)
    expect(screen.getByText("👤")).toBeInTheDocument();
    expect(screen.getByText("🚀")).toBeInTheDocument();
  });

  it("should close dropdown when backdrop is clicked", async () => {
    const user = userEvent.setup();
    (useQuery as vi.Mock).mockImplementation(() => {
      queryCallCount++;
      if (queryCallCount % 2 === 1) return []; // Odd calls = notifications list
      return 0; // Even calls = unread count
    });

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    const heading = screen.getByRole("heading", { name: /Notifications/i });
    expect(heading).toBeInTheDocument();

    // Click backdrop by aria-label
    const backdrop = screen.getByLabelText("Close notifications");
    await user.click(backdrop);

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: /Notifications/i })).not.toBeInTheDocument();
    });
  });
});
