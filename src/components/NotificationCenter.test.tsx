import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationCenter } from "./NotificationCenter";
import { useQuery, useMutation } from "convex/react";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

describe("NotificationCenter", () => {
  const mockMarkAsRead = vi.fn();
  const mockMarkAllAsRead = vi.fn();
  const mockRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock mutations - they're called in order in the component
    (useMutation as any)
      .mockReturnValueOnce(mockMarkAsRead)
      .mockReturnValueOnce(mockMarkAllAsRead)
      .mockReturnValueOnce(mockRemove);
    // Default mock for useQuery
    (useQuery as any).mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render notification bell button", () => {
    (useQuery as any).mockReturnValue(undefined);

    render(<NotificationCenter />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should show unread count badge when there are unread notifications", () => {
    // First call is for notifications list, second is for unread count
    (useQuery as any).mockReturnValueOnce([]).mockReturnValueOnce(5);

    render(<NotificationCenter />);

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should not show badge when unread count is 0", () => {
    let callCount = 0;
    (useQuery as any).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? [] : 0; // 1st call: notifications, 2nd call: unreadCount
    });

    render(<NotificationCenter />);

    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("should show 99+ when unread count exceeds 99", () => {
    (useQuery as any).mockReturnValueOnce([]).mockReturnValueOnce(150);

    render(<NotificationCenter />);

    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("should open dropdown when bell is clicked", async () => {
    const user = userEvent.setup();
    (useQuery as any).mockReturnValueOnce([]).mockReturnValueOnce(0);

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByRole("heading", { name: /Notifications/i })).toBeInTheDocument();
  });

  it("should show empty state when no notifications", async () => {
    const user = userEvent.setup();
    (useQuery as any).mockReturnValueOnce([]).mockReturnValueOnce(0);

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
    (useQuery as any).mockReturnValueOnce(mockNotifications).mockReturnValueOnce(1);

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByText(/Issue assigned/i)).toBeInTheDocument();
    expect(screen.getByText(/New comment/i)).toBeInTheDocument();
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
    (useQuery as any).mockReturnValueOnce(mockNotifications).mockReturnValueOnce(1);

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    const notification = screen.getByText(/Unread/i).closest("div");
    expect(notification?.className).toContain("bg-blue-50");
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
    (useQuery as any).mockReturnValueOnce(mockNotifications).mockReturnValueOnce(1);
    mockMarkAsRead.mockResolvedValue(undefined);

    render(<NotificationCenter />);

    const bellButton = screen.getByRole("button");
    await user.click(bellButton);

    const markReadButton = screen.getByTitle(/Mark as read/i);
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
    (useQuery as any).mockReturnValueOnce(mockNotifications).mockReturnValueOnce(1);
    mockMarkAllAsRead.mockResolvedValue(undefined);

    render(<NotificationCenter />);

    const bellButton = screen.getByRole("button");
    await user.click(bellButton);

    const markAllButton = screen.getByText(/Mark all read/i);
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
    (useQuery as any).mockReturnValueOnce(mockNotifications).mockReturnValueOnce(0);
    mockRemove.mockResolvedValue(undefined);

    render(<NotificationCenter />);

    const bellButton = screen.getByRole("button");
    await user.click(bellButton);

    const deleteButton = screen.getByTitle(/Delete/i);
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
        title: "Just now",
        message: "Test",
        isRead: false,
        createdAt: now,
      },
      {
        _id: "2",
        type: "issue_assigned",
        title: "Minutes ago",
        message: "Test",
        isRead: false,
        createdAt: now - 5 * 60 * 1000, // 5 minutes
      },
      {
        _id: "3",
        type: "issue_assigned",
        title: "Hours ago",
        message: "Test",
        isRead: false,
        createdAt: now - 2 * 60 * 60 * 1000, // 2 hours
      },
    ];
    (useQuery as any).mockReturnValueOnce(mockNotifications).mockReturnValueOnce(3);

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByText(/Just now/i)).toBeInTheDocument();
    expect(screen.getByText(/5m ago/i)).toBeInTheDocument();
    expect(screen.getByText(/2h ago/i)).toBeInTheDocument();
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
    (useQuery as any).mockReturnValueOnce(mockNotifications).mockReturnValueOnce(2);

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    // Check that icons are rendered (emojis)
    expect(screen.getByText("👤")).toBeInTheDocument();
    expect(screen.getByText("🚀")).toBeInTheDocument();
  });

  it("should close dropdown when backdrop is clicked", async () => {
    const user = userEvent.setup();
    (useQuery as any).mockReturnValueOnce([]).mockReturnValueOnce(0);

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    const heading = screen.getByRole("heading", { name: /Notifications/i });
    expect(heading).toBeInTheDocument();

    // Click backdrop (the fixed overlay before the dropdown)
    const backdrop = heading.closest(".absolute")?.previousSibling as HTMLElement;
    if (backdrop) {
      await user.click(backdrop);
    }

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: /Notifications/i })).not.toBeInTheDocument();
    });
  });
});
