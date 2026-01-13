import { useMutation, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/custom-render";
import { UnsubscribePage } from "./UnsubscribePage";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

describe("UnsubscribePage", () => {
  const mockToken = "valid-token-123";
  const mockUser = { _id: "user-1", name: "Test User", email: "test@example.com" };
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up mutation mocks
    vi.mocked(useMutation).mockImplementation(() => {
      return mockUnsubscribe as any;
    });

    // Default mock for useQuery (loading state)
    vi.mocked(useQuery).mockImplementation(() => {
      return undefined as any;
    });
  });

  it("renders loading state initially", () => {
    // useQuery is already mocked to return undefined (loading) in beforeEach

    render(<UnsubscribePage token={mockToken} />);

    expect(screen.getByText("Processing...")).toBeInTheDocument();
    expect(screen.getByText("Unsubscribing you from email notifications")).toBeInTheDocument();
  });

  it("renders success state when unsubscribe is successful", async () => {
    vi.mocked(useQuery).mockReturnValue(mockUser); // Token is valid
    mockUnsubscribe.mockResolvedValue(undefined); // Unsubscribe successful

    render(<UnsubscribePage token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText("Successfully Unsubscribed")).toBeInTheDocument();
      expect(
        screen.getByText("You have been unsubscribed from all email notifications."),
      ).toBeInTheDocument();
    });
  });

  it("renders invalid state when token is invalid", async () => {
    vi.mocked(useQuery).mockReturnValue(null); // Token is invalid

    render(<UnsubscribePage token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText("Invalid or Expired Link")).toBeInTheDocument();
      expect(
        screen.getByText(
          "This unsubscribe link is invalid or has expired. Links expire after 30 days.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("renders error state when unsubscribe fails", async () => {
    vi.mocked(useQuery).mockReturnValue(mockUser); // Token is valid
    mockUnsubscribe.mockRejectedValue(new Error("Network error")); // Unsubscribe failed

    render(<UnsubscribePage token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText("Something Went Wrong")).toBeInTheDocument();
      expect(screen.getByText("We couldn't process your unsubscribe request.")).toBeInTheDocument();
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
});
