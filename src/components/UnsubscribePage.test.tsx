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
    (useMutation as any).mockReturnValue(mockUnsubscribe);
  });

  it("renders loading state initially", () => {
    (useQuery as any).mockReturnValue(undefined); // Loading state for getUserFromToken

    render(<UnsubscribePage token={mockToken} />);

    expect(screen.getByText("Processing...")).toBeInTheDocument();
    expect(screen.getByText("Unsubscribing you from email notifications")).toBeInTheDocument();
  });

  it("renders success state when unsubscribe is successful", async () => {
    (useQuery as any).mockReturnValue(mockUser); // Token is valid
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
    (useQuery as any).mockReturnValue(null); // Token is invalid

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
    (useQuery as any).mockReturnValue(mockUser); // Token is valid
    mockUnsubscribe.mockRejectedValue(new Error("Network error")); // Unsubscribe failed

    render(<UnsubscribePage token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText("Something Went Wrong")).toBeInTheDocument();
      expect(screen.getByText("We couldn't process your unsubscribe request.")).toBeInTheDocument();
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
});
