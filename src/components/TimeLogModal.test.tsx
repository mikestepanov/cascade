import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimeLogModal } from "./TimeLogModal";
import { useQuery, useMutation } from "convex/react";

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

describe("TimeLogModal", () => {
  const mockLogTime = vi.fn();
  const mockOnClose = vi.fn();
  const mockIssueId = "test-issue-id" as any;

  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as any).mockReturnValue(mockLogTime);
  });

  it("should render the modal with correct issue name", () => {
    render(
      <TimeLogModal issueId={mockIssueId} issueName="TEST-123: Fix bug" onClose={mockOnClose} />,
    );

    expect(screen.getByText(/Log Time on/i)).toBeInTheDocument();
    expect(screen.getByText(/TEST-123: Fix bug/i)).toBeInTheDocument();
  });

  it("should have hours input with correct step", () => {
    render(<TimeLogModal issueId={mockIssueId} issueName="TEST-123" onClose={mockOnClose} />);

    const hoursInput = screen.getByLabelText(/Hours/i) as HTMLInputElement;
    expect(hoursInput).toBeInTheDocument();
    expect(hoursInput.type).toBe("number");
    expect(hoursInput.step).toBe("0.25");
    expect(hoursInput.min).toBe("0.25");
  });

  it("should have date input defaulting to today", () => {
    render(<TimeLogModal issueId={mockIssueId} issueName="TEST-123" onClose={mockOnClose} />);

    const dateInput = screen.getByLabelText(/Date/i) as HTMLInputElement;
    expect(dateInput).toBeInTheDocument();
    expect(dateInput.type).toBe("date");

    // Should default to today
    const today = new Date().toISOString().split("T")[0];
    expect(dateInput.value).toBe(today);
  });

  it("should allow entering hours and description", async () => {
    const user = userEvent.setup();
    render(<TimeLogModal issueId={mockIssueId} issueName="TEST-123" onClose={mockOnClose} />);

    const hoursInput = screen.getByLabelText(/Hours/i);
    const descriptionInput = screen.getByLabelText(/Description/i);

    await user.clear(hoursInput);
    await user.type(hoursInput, "2.5");
    await user.type(descriptionInput, "Fixed the authentication bug");

    expect(hoursInput).toHaveValue(2.5);
    expect(descriptionInput).toHaveValue("Fixed the authentication bug");
  });

  it("should call logTime mutation on submit with valid data", async () => {
    const user = userEvent.setup();
    mockLogTime.mockResolvedValue(undefined);

    render(<TimeLogModal issueId={mockIssueId} issueName="TEST-123" onClose={mockOnClose} />);

    const hoursInput = screen.getByLabelText(/Hours/i);
    const submitButton = screen.getByRole("button", { name: /Log Time/i });

    await user.clear(hoursInput);
    await user.type(hoursInput, "3");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogTime).toHaveBeenCalledWith(
        expect.objectContaining({
          issueId: mockIssueId,
          hours: 3,
        }),
      );
    });
  });

  it("should call onClose after successful submission", async () => {
    const user = userEvent.setup();
    mockLogTime.mockResolvedValue(undefined);

    render(<TimeLogModal issueId={mockIssueId} issueName="TEST-123" onClose={mockOnClose} />);

    const hoursInput = screen.getByLabelText(/Hours/i);
    const submitButton = screen.getByRole("button", { name: /Log Time/i });

    await user.clear(hoursInput);
    await user.type(hoursInput, "1.5");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("should close modal when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<TimeLogModal issueId={mockIssueId} issueName="TEST-123" onClose={mockOnClose} />);

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should not submit when hours input is empty", async () => {
    const user = userEvent.setup();
    render(<TimeLogModal issueId={mockIssueId} issueName="TEST-123" onClose={mockOnClose} />);

    const submitButton = screen.getByRole("button", { name: /Log Time/i });
    await user.click(submitButton);

    expect(mockLogTime).not.toHaveBeenCalled();
  });

  it("should include description when provided", async () => {
    const user = userEvent.setup();
    mockLogTime.mockResolvedValue(undefined);

    render(<TimeLogModal issueId={mockIssueId} issueName="TEST-123" onClose={mockOnClose} />);

    const hoursInput = screen.getByLabelText(/Hours/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const submitButton = screen.getByRole("button", { name: /Log Time/i });

    await user.clear(hoursInput);
    await user.type(hoursInput, "2");
    await user.type(descriptionInput, "Code review");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogTime).toHaveBeenCalledWith(
        expect.objectContaining({
          issueId: mockIssueId,
          hours: 2,
          description: "Code review",
        }),
      );
    });
  });
});
