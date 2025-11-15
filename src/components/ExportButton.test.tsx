import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExportButton } from "./ExportButton";
import { useQuery } from "convex/react";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ExportButton", () => {
  const mockProjectId = "project-123" as any;
  let mockLink: any;

  beforeEach(() => {
    vi.clearAllMocks();
    (useQuery as any).mockReturnValue(undefined);

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => "blob:test-url");
    global.URL.revokeObjectURL = vi.fn();

    // Mock document methods
    mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);
    vi.spyOn(document.body, "appendChild").mockReturnValue(mockLink as any);
    vi.spyOn(document.body, "removeChild").mockReturnValue(mockLink as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render export button", () => {
    render(<ExportButton projectId={mockProjectId} />);

    expect(screen.getByRole("button", { name: /Export CSV/i })).toBeInTheDocument();
  });

  it("should show loading state when exporting", async () => {
    const user = userEvent.setup();
    render(<ExportButton projectId={mockProjectId} />);

    const button = screen.getByRole("button", { name: /Export CSV/i });
    await user.click(button);

    expect(screen.getByText(/Exporting/i)).toBeInTheDocument();
  });

  it("should trigger CSV query when button is clicked", async () => {
    const user = userEvent.setup();
    const mockUseQuery = useQuery as any;

    render(<ExportButton projectId={mockProjectId} />);

    // Initially should not query (skip)
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      "skip"
    );

    const button = screen.getByRole("button", { name: /Export CSV/i });
    await user.click(button);

    // After click should query with project ID
    await waitFor(() => {
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          projectId: mockProjectId,
        })
      );
    });
  });

  it("should download CSV file when data is ready", async () => {
    const user = userEvent.setup();
    const csvData = "Key,Title,Type\nTEST-1,Test Issue,task";
    let queryResult: any = undefined;

    (useQuery as any).mockImplementation((_, args: any) => {
      if (args === "skip") return undefined;
      return queryResult;
    });

    const { rerender } = render(<ExportButton projectId={mockProjectId} />);

    const button = screen.getByRole("button", { name: /Export CSV/i });
    await user.click(button);

    // Simulate data becoming available
    queryResult = csvData;
    rerender(<ExportButton projectId={mockProjectId} />);

    await waitFor(() => {
      expect(document.createElement).toHaveBeenCalledWith("a");
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it("should create blob with correct CSV content", async () => {
    const user = userEvent.setup();
    const csvData = "Key,Title\nTEST-1,Issue";
    let queryResult: any = undefined;

    const mockBlob = vi.fn();
    global.Blob = mockBlob as any;

    (useQuery as any).mockImplementation((_, args: any) => {
      if (args === "skip") return undefined;
      return queryResult;
    });

    const { rerender } = render(<ExportButton projectId={mockProjectId} />);

    const button = screen.getByRole("button", { name: /Export CSV/i });
    await user.click(button);

    queryResult = csvData;
    rerender(<ExportButton projectId={mockProjectId} />);

    await waitFor(() => {
      expect(mockBlob).toHaveBeenCalledWith(
        [csvData],
        { type: "text/csv;charset=utf-8;" }
      );
    });
  });

  it("should include sprint filter when sprintId is provided", async () => {
    const user = userEvent.setup();
    const sprintId = "sprint-456" as any;

    render(<ExportButton projectId={mockProjectId} sprintId={sprintId} />);

    const button = screen.getByRole("button", { name: /Export CSV/i });
    await user.click(button);

    await waitFor(() => {
      expect(useQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          projectId: mockProjectId,
          sprintId: sprintId,
        })
      );
    });
  });

  it("should include status filter when status is provided", async () => {
    const user = userEvent.setup();
    const status = "in-progress";

    render(<ExportButton projectId={mockProjectId} status={status} />);

    const button = screen.getByRole("button", { name: /Export CSV/i });
    await user.click(button);

    await waitFor(() => {
      expect(useQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          projectId: mockProjectId,
          status: status,
        })
      );
    });
  });

  it("should generate filename with timestamp", async () => {
    const user = userEvent.setup();
    const csvData = "test,data";
    let queryResult: any = undefined;

    (useQuery as any).mockImplementation((_, args: any) => {
      if (args === "skip") return undefined;
      return queryResult;
    });

    const { rerender } = render(<ExportButton projectId={mockProjectId} />);

    const button = screen.getByRole("button", { name: /Export CSV/i });
    await user.click(button);

    queryResult = csvData;
    rerender(<ExportButton projectId={mockProjectId} />);

    await waitFor(() => {
      const mockLink = (document.createElement as any).mock.results[0].value;
      expect(mockLink.download).toMatch(/issues-export-\d{4}-\d{2}-\d{2}\.csv/);
    });
  });

  it("should clean up blob URL after download", async () => {
    const user = userEvent.setup();
    const csvData = "test";
    let queryResult: any = undefined;

    (useQuery as any).mockImplementation((_, args: any) => {
      if (args === "skip") return undefined;
      return queryResult;
    });

    const { rerender } = render(<ExportButton projectId={mockProjectId} />);

    const button = screen.getByRole("button", { name: /Export CSV/i });
    await user.click(button);

    queryResult = csvData;
    rerender(<ExportButton projectId={mockProjectId} />);

    await waitFor(() => {
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  it("should be disabled while exporting", async () => {
    const user = userEvent.setup();
    render(<ExportButton projectId={mockProjectId} />);

    const button = screen.getByRole("button", { name: /Export CSV/i });
    expect(button).not.toBeDisabled();

    await user.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });
});
