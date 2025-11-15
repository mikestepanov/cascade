import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportExportModal } from "./ImportExportModal";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";

// Mock dependencies
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ImportExportModal - Component Behavior", () => {
  const mockProjectId = "project123" as any;
  const mockOnClose = vi.fn();
  const mockImportCSV = vi.fn();
  const mockImportJSON = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as any).mockReturnValueOnce(mockImportCSV).mockReturnValueOnce(mockImportJSON);
    (useQuery as any).mockReturnValue(undefined);
  });

  describe("Mode Switching Logic", () => {
    it("should default to export mode", () => {
      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      expect(screen.getByText("Select Export Format")).toBeInTheDocument();
    });

    it("should switch to import mode when Import button clicked", async () => {
      const user = userEvent.setup();

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));

      expect(screen.getByText("Select Import Format")).toBeInTheDocument();
      expect(screen.queryByText("Select Export Format")).not.toBeInTheDocument();
    });

    it("should switch back to export mode when Export button clicked", async () => {
      const user = userEvent.setup();

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));
      await user.click(screen.getByText("📤 Export"));

      expect(screen.getByText("Select Export Format")).toBeInTheDocument();
      expect(screen.queryByText("Select Import Format")).not.toBeInTheDocument();
    });

    it("should maintain separate format selections for export and import", async () => {
      const user = userEvent.setup();

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      // Set export to JSON
      await user.click(screen.getByText("JSON"));
      expect(screen.getByRole("button", { name: /Export as JSON/i })).toBeInTheDocument();

      // Switch to import (should default to CSV)
      await user.click(screen.getByText("📥 Import"));
      expect(screen.getByRole("button", { name: /Import from CSV/i })).toBeInTheDocument();

      // Switch back to export (should still be JSON)
      await user.click(screen.getByText("📤 Export"));
      expect(screen.getByRole("button", { name: /Export as JSON/i })).toBeInTheDocument();
    });
  });

  describe("Export Empty Data Validation", () => {
    it("should show error when export data is empty", async () => {
      const user = userEvent.setup();

      // First query call returns undefined, second returns empty string
      let queryCallCount = 0;
      (useQuery as any).mockImplementation(() => {
        queryCallCount++;
        return queryCallCount > 1 ? "" : undefined;
      });

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Export as CSV/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("No data to export");
      });
    });

    it("should show error when export data is whitespace-only", async () => {
      const user = userEvent.setup();

      let queryCallCount = 0;
      (useQuery as any).mockImplementation(() => {
        queryCallCount++;
        return queryCallCount > 1 ? "   " : undefined;
      });

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Export as CSV/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("No data to export");
      });
    });

    it("should NOT show error when export has valid data", async () => {
      const user = userEvent.setup();

      // Mock document createElement/appendChild for download
      const mockLink = {
        href: "",
        download: "",
        click: vi.fn(),
      };
      vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);
      vi.spyOn(document.body, "appendChild").mockReturnValue(undefined as any);
      vi.spyOn(document.body, "removeChild").mockReturnValue(undefined as any);
      global.URL.createObjectURL = vi.fn(() => "blob:mock");
      global.URL.revokeObjectURL = vi.fn();

      let queryCallCount = 0;
      (useQuery as any).mockImplementation(() => {
        queryCallCount++;
        return queryCallCount > 1 ? "key,title\nTEST-1,Issue" : undefined;
      });

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Export as CSV/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Issues exported successfully!");
        expect(toast.error).not.toHaveBeenCalledWith("No data to export");
      });
    });
  });

  describe("Export Button State", () => {
    it("should show 'Exporting...' text when isExporting is true", async () => {
      const user = userEvent.setup();
      (useQuery as any).mockReturnValue(undefined); // Keep loading

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Export as CSV/i }));

      expect(screen.getByText("Exporting...")).toBeInTheDocument();
    });

    it("should disable export button while exporting", async () => {
      const user = userEvent.setup();
      (useQuery as any).mockReturnValue(undefined);

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      const exportButton = screen.getByRole("button", { name: /Export as CSV/i });
      await user.click(exportButton);

      expect(exportButton).toBeDisabled();
    });

    it("should show correct format in button text when switching formats", async () => {
      const user = userEvent.setup();

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      expect(screen.getByRole("button", { name: /Export as CSV/i })).toBeInTheDocument();

      await user.click(screen.getByText("JSON"));

      expect(screen.getByRole("button", { name: /Export as JSON/i })).toBeInTheDocument();
    });
  });

  describe("Import File Validation", () => {
    it("should show error when trying to import without selecting file", async () => {
      const user = userEvent.setup();

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));
      await user.click(screen.getByRole("button", { name: /Import from CSV/i }));

      expect(toast.error).toHaveBeenCalledWith("Please select a file to import");
    });

    it("should disable import button when no file selected", async () => {
      const user = userEvent.setup();

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      expect(importButton).toBeDisabled();
    });

    it("should enable import button after file is selected", async () => {
      const user = userEvent.setup();

      // Mock FileReader
      global.FileReader = class {
        onload: any;
        readAsText() {
          setTimeout(() => {
            this.onload({ target: { result: "title\nTest Issue" } });
          }, 0);
        }
      } as any;

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));

      const fileInput = screen.getByLabelText(/Select File/i);
      const file = new File(["title\nTest"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        const importButton = screen.getByRole("button", { name: /Import from CSV/i });
        expect(importButton).not.toBeDisabled();
      });
    });
  });

  describe("File Selection Display", () => {
    it("should display selected file name and size", async () => {
      const user = userEvent.setup();

      global.FileReader = class {
        onload: any;
        readAsText() {
          setTimeout(() => {
            this.onload({ target: { result: "data" } });
          }, 0);
        }
      } as any;

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));

      const fileInput = screen.getByLabelText(/Select File/i);
      const file = new File(["a".repeat(2048)], "issues.csv", { type: "text/csv" });

      await user.click(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/Selected: issues\.csv/i)).toBeInTheDocument();
        expect(screen.getByText(/2\.00 KB/i)).toBeInTheDocument();
      });
    });

    it("should calculate file size correctly", async () => {
      const user = userEvent.setup();

      global.FileReader = class {
        onload: any;
        readAsText() {
          setTimeout(() => {
            this.onload({ target: { result: "data" } });
          }, 0);
        }
      } as any;

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));

      const fileInput = screen.getByLabelText(/Select File/i);
      // Create 5KB file
      const file = new File(["a".repeat(5120)], "data.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/5\.00 KB/i)).toBeInTheDocument();
      });
    });
  });

  describe("Import Success Message Formatting", () => {
    it("should use singular 'issue' when importing 1 issue", async () => {
      const user = userEvent.setup();

      global.FileReader = class {
        onload: any;
        readAsText() {
          setTimeout(() => {
            this.onload({ target: { result: "title\nIssue 1" } });
          }, 0);
        }
      } as any;

      mockImportCSV.mockResolvedValue({ imported: 1, failed: 0, errors: [] });

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));

      const fileInput = screen.getByLabelText(/Select File/i);
      const file = new File(["title\nIssue"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        const importButton = screen.getByRole("button", { name: /Import from CSV/i });
        expect(importButton).not.toBeDisabled();
      });

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Successfully imported 1 issue");
      });
    });

    it("should use plural 'issues' when importing multiple", async () => {
      const user = userEvent.setup();

      global.FileReader = class {
        onload: any;
        readAsText() {
          setTimeout(() => {
            this.onload({ target: { result: "title\nIssue 1\nIssue 2" } });
          }, 0);
        }
      } as any;

      mockImportCSV.mockResolvedValue({ imported: 5, failed: 0, errors: [] });

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));

      const fileInput = screen.getByLabelText(/Select File/i);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {});

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Successfully imported 5 issues");
      });
    });

    it("should include failure count in success message when some failed", async () => {
      const user = userEvent.setup();

      global.FileReader = class {
        onload: any;
        readAsText() {
          setTimeout(() => {
            this.onload({ target: { result: "data" } });
          }, 0);
        }
      } as any;

      mockImportCSV.mockResolvedValue({
        imported: 8,
        failed: 2,
        errors: ["Error 1", "Error 2"],
      });

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));

      const fileInput = screen.getByLabelText(/Select File/i);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {});

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Successfully imported 8 issues (2 failed)");
      });
    });

    it("should NOT show failure count when all succeeded", async () => {
      const user = userEvent.setup();

      global.FileReader = class {
        onload: any;
        readAsText() {
          setTimeout(() => {
            this.onload({ target: { result: "data" } });
          }, 0);
        }
      } as any;

      mockImportCSV.mockResolvedValue({ imported: 10, failed: 0, errors: [] });

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));

      const fileInput = screen.getByLabelText(/Select File/i);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {});

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        const successCall = vi.mocked(toast.success).mock.calls[0][0];
        expect(successCall).toBe("Successfully imported 10 issues");
        expect(successCall).not.toContain("failed");
      });
    });
  });

  describe("Import Error Handling", () => {
    it("should show error when no issues were imported", async () => {
      const user = userEvent.setup();

      global.FileReader = class {
        onload: any;
        readAsText() {
          setTimeout(() => {
            this.onload({ target: { result: "data" } });
          }, 0);
        }
      } as any;

      mockImportCSV.mockResolvedValue({ imported: 0, failed: 5, errors: [] });

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));

      const fileInput = screen.getByLabelText(/Select File/i);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {});

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("No issues were imported");
      });
    });

    it("should show error message when import fails", async () => {
      const user = userEvent.setup();

      global.FileReader = class {
        onload: any;
        readAsText() {
          setTimeout(() => {
            this.onload({ target: { result: "data" } });
          }, 0);
        }
      } as any;

      mockImportCSV.mockRejectedValue(new Error("Invalid CSV format"));

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));

      const fileInput = screen.getByLabelText(/Select File/i);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {});

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Invalid CSV format");
      });
    });

    it("should show generic error when error has no message", async () => {
      const user = userEvent.setup();

      global.FileReader = class {
        onload: any;
        readAsText() {
          setTimeout(() => {
            this.onload({ target: { result: "data" } });
          }, 0);
        }
      } as any;

      mockImportCSV.mockRejectedValue(new Error());

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));

      const fileInput = screen.getByLabelText(/Select File/i);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {});

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to import issues");
      });
    });
  });

  describe("Import Button State", () => {
    it("should show 'Importing...' text while importing", async () => {
      const user = userEvent.setup();

      global.FileReader = class {
        onload: any;
        readAsText() {
          setTimeout(() => {
            this.onload({ target: { result: "data" } });
          }, 0);
        }
      } as any;

      mockImportCSV.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ imported: 1, failed: 0 }), 100)),
      );

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));

      const fileInput = screen.getByLabelText(/Select File/i);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {});

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      expect(screen.getByText("Importing...")).toBeInTheDocument();
    });

    it("should disable import button while importing", async () => {
      const user = userEvent.setup();

      global.FileReader = class {
        onload: any;
        readAsText() {
          setTimeout(() => {
            this.onload({ target: { result: "data" } });
          }, 0);
        }
      } as any;

      mockImportCSV.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ imported: 1, failed: 0 }), 100)),
      );

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));

      const fileInput = screen.getByLabelText(/Select File/i);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {});

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      const disabledButton = screen.getByRole("button", { name: /Importing/i });
      expect(disabledButton).toBeDisabled();
    });
  });

  describe("Modal Close Behavior", () => {
    it("should close modal after successful import", async () => {
      const user = userEvent.setup();

      global.FileReader = class {
        onload: any;
        readAsText() {
          setTimeout(() => {
            this.onload({ target: { result: "data" } });
          }, 0);
        }
      } as any;

      mockImportCSV.mockResolvedValue({ imported: 3, failed: 0, errors: [] });

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));

      const fileInput = screen.getByLabelText(/Select File/i);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {});

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("should NOT close modal when import fails", async () => {
      const user = userEvent.setup();

      global.FileReader = class {
        onload: any;
        readAsText() {
          setTimeout(() => {
            this.onload({ target: { result: "data" } });
          }, 0);
        }
      } as any;

      mockImportCSV.mockResolvedValue({ imported: 0, failed: 2, errors: [] });

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));

      const fileInput = screen.getByLabelText(/Select File/i);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {});

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });

  describe("File Accept Attribute", () => {
    it("should accept .csv files when CSV format selected", async () => {
      const user = userEvent.setup();

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));

      const fileInput = screen.getByLabelText(/Select File/i);
      expect(fileInput).toHaveAttribute("accept", ".csv");
    });

    it("should accept .json files when JSON format selected", async () => {
      const user = userEvent.setup();

      render(<ImportExportModal isOpen={true} onClose={mockOnClose} projectId={mockProjectId} />);

      await user.click(screen.getByText("📥 Import"));
      await user.click(screen.getByText("JSON"));

      const fileInput = screen.getByLabelText(/Select File/i);
      expect(fileInput).toHaveAttribute("accept", ".json");
    });
  });
});
