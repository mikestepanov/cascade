import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { render, screen } from "@/test/custom-render";
import { BoardToolbar } from "./BoardToolbar";

describe("BoardToolbar", () => {
  const mockProps = {
    selectionMode: false,
    historyStack: [],
    redoStack: [],
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onToggleSelectionMode: vi.fn(),
  };

  it("renders undo and redo buttons", () => {
    render(
      <TooltipProvider>
        <BoardToolbar {...mockProps} historyStack={[1]} redoStack={[1]} />
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: /Undo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Redo/i })).toBeInTheDocument();
  });
});
