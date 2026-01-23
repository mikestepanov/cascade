import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { BoardToolbar } from "./BoardToolbar";

describe("BoardToolbar", () => {
  const defaultProps = {
    selectionMode: false,
    historyStack: [],
    redoStack: [],
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onToggleSelectionMode: vi.fn(),
    showControls: true,
  };

  it("should show tooltip for Undo button", async () => {
    const user = userEvent.setup();
    // Provide history so button is enabled
    render(<BoardToolbar {...defaultProps} historyStack={["action"]} />);

    const undoButton = screen.getByLabelText("Undo (Ctrl+Z)");
    await user.hover(undoButton);

    const tooltip = await screen.findByRole("tooltip", { name: "Undo (Ctrl+Z)" });
    expect(tooltip).toBeInTheDocument();
  });

  it("should show tooltip for Redo button", async () => {
    const user = userEvent.setup();
    // Provide redo stack so button is enabled
    render(<BoardToolbar {...defaultProps} redoStack={["action"]} />);

    const redoButton = screen.getByLabelText("Redo (Ctrl+Shift+Z)");
    await user.hover(redoButton);

    const tooltip = await screen.findByRole("tooltip", { name: "Redo (Ctrl+Shift+Z)" });
    expect(tooltip).toBeInTheDocument();
  });
});
