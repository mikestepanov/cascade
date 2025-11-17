import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ColorPicker } from "./ColorPicker";

const DEFAULT_PRESET_COLORS = [
  "#EF4444", // red
  "#F59E0B", // amber
  "#10B981", // emerald
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#6B7280", // gray
  "#14B8A6", // teal
];

describe("ColorPicker", () => {
  describe("Basic Rendering", () => {
    it("should render default label", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      expect(screen.getByText("Color")).toBeInTheDocument();
    });

    it("should render custom label", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} label="Choose Color" />);

      expect(screen.getByText("Choose Color")).toBeInTheDocument();
    });

    it("should render all default preset color buttons", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      // Should have 8 preset buttons + 1 custom color input
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(8);
    });

    it("should render custom color input", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      const colorInput = screen.getByLabelText("Custom color picker");
      expect(colorInput).toBeInTheDocument();
      expect(colorInput).toHaveAttribute("type", "color");
    });

    it("should display 'Custom' text below color input", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      expect(screen.getByText("Custom")).toBeInTheDocument();
    });
  });

  describe("Preset Colors", () => {
    it("should render buttons for all preset colors", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      DEFAULT_PRESET_COLORS.forEach((color) => {
        const button = screen.getByLabelText(`Select color ${color}`);
        expect(button).toBeInTheDocument();
      });
    });

    it("should apply correct background color to preset buttons", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      DEFAULT_PRESET_COLORS.forEach((color) => {
        const button = screen.getByLabelText(`Select color ${color}`);
        expect(button).toHaveStyle({ backgroundColor: color });
      });
    });

    it("should have title attribute with color value", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      DEFAULT_PRESET_COLORS.forEach((color) => {
        const button = screen.getByLabelText(`Select color ${color}`);
        expect(button).toHaveAttribute("title", color);
      });
    });

    it("should use custom preset colors when provided", () => {
      const customColors = ["#000000", "#FFFFFF", "#FF0000"];
      render(<ColorPicker value="#000000" onChange={vi.fn()} presetColors={customColors} />);

      customColors.forEach((color) => {
        expect(screen.getByLabelText(`Select color ${color}`)).toBeInTheDocument();
      });

      // Should not show default colors
      expect(screen.queryByLabelText("Select color #EF4444")).not.toBeInTheDocument();
    });

    it("should handle empty preset colors array", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} presetColors={[]} />);

      // Should only have the custom color input, no preset buttons
      const buttons = screen.queryAllByRole("button");
      expect(buttons).toHaveLength(0);

      // Custom input should still exist
      expect(screen.getByLabelText("Custom color picker")).toBeInTheDocument();
    });
  });

  describe("Selected State", () => {
    it("should highlight selected preset color", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      const selectedButton = screen.getByLabelText("Select color #EF4444");
      expect(selectedButton).toHaveClass("ring-2");
      expect(selectedButton).toHaveClass("ring-offset-2");
      expect(selectedButton).toHaveClass("scale-110");
    });

    it("should not highlight non-selected colors", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      const nonSelectedButton = screen.getByLabelText("Select color #F59E0B");
      expect(nonSelectedButton).not.toHaveClass("ring-2");
      expect(nonSelectedButton).not.toHaveClass("scale-110");
    });

    it("should update highlight when value changes", () => {
      const { rerender } = render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      const selectedButton = screen.getByLabelText("Select color #EF4444");
      expect(selectedButton).toHaveClass("scale-110");

      // Change value
      rerender(<ColorPicker value="#F59E0B" onChange={vi.fn()} />);

      const previousButton = screen.getByLabelText("Select color #EF4444");
      expect(previousButton).not.toHaveClass("scale-110");

      const newButton = screen.getByLabelText("Select color #F59E0B");
      expect(newButton).toHaveClass("scale-110");
    });
  });

  describe("Preset Color Interactions", () => {
    it("should call onChange when preset color is clicked", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<ColorPicker value="#EF4444" onChange={onChange} />);

      const button = screen.getByLabelText("Select color #F59E0B");
      await user.click(button);

      expect(onChange).toHaveBeenCalledWith("#F59E0B");
    });

    it("should call onChange with correct color for each preset", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<ColorPicker value="#EF4444" onChange={onChange} />);

      for (const color of DEFAULT_PRESET_COLORS) {
        const button = screen.getByLabelText(`Select color ${color}`);
        await user.click(button);
        expect(onChange).toHaveBeenCalledWith(color);
      }

      expect(onChange).toHaveBeenCalledTimes(DEFAULT_PRESET_COLORS.length);
    });

    it("should call onChange when clicking already selected color", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<ColorPicker value="#EF4444" onChange={onChange} />);

      const button = screen.getByLabelText("Select color #EF4444");
      await user.click(button);

      expect(onChange).toHaveBeenCalledWith("#EF4444");
    });

    it("should have button type to prevent form submission", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("type", "button");
      });
    });
  });

  describe("Custom Color Input", () => {
    it("should display current value in custom color input", () => {
      render(<ColorPicker value="#ab12cd" onChange={vi.fn()} />);

      const colorInput = screen.getByLabelText("Custom color picker");
      // Browsers normalize color input values to lowercase
      expect(colorInput).toHaveValue("#ab12cd");
    });

    it("should call onChange when custom color input changes", () => {
      const onChange = vi.fn();

      render(<ColorPicker value="#EF4444" onChange={onChange} />);

      const colorInput = screen.getByLabelText("Custom color picker");

      // Simulate color input change using fireEvent (color inputs don't support userEvent.type)
      const newColor = "#123456";
      fireEvent.change(colorInput, { target: { value: newColor } });

      expect(onChange).toHaveBeenCalledWith(newColor);
    });

    it("should have correct accessibility attributes", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      const colorInput = screen.getByLabelText("Custom color picker");
      expect(colorInput).toHaveAttribute("aria-label", "Custom color picker");
      expect(colorInput).toHaveAttribute("title", "Custom color");
    });

    it("should have correct styling classes", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      const colorInput = screen.getByLabelText("Custom color picker");
      expect(colorInput).toHaveClass("w-8");
      expect(colorInput).toHaveClass("h-8");
      expect(colorInput).toHaveClass("rounded");
      expect(colorInput).toHaveClass("cursor-pointer");
    });
  });

  describe("Styling and Layout", () => {
    it("should have flex layout for color buttons", () => {
      const { container } = render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      const colorContainer = container.querySelector(".flex.gap-2");
      expect(colorContainer).toBeInTheDocument();
      expect(colorContainer).toHaveClass("flex-wrap");
      expect(colorContainer).toHaveClass("items-center");
    });

    it("should have rounded-full class on preset buttons", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveClass("rounded-full");
      });
    });

    it("should have hover and focus styles on preset buttons", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      const button = screen.getByLabelText("Select color #EF4444");
      expect(button).toHaveClass("hover:scale-110");
      expect(button).toHaveClass("focus:outline-none");
      expect(button).toHaveClass("focus:ring-2");
    });

    it("should have label styling", () => {
      const { container } = render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      const label = container.querySelector(".text-sm.font-medium");
      expect(label).toBeInTheDocument();
      expect(label).toHaveClass("text-gray-700");
      expect(label).toHaveClass("dark:text-gray-300");
    });
  });

  describe("Accessibility", () => {
    it("should have aria-label for each preset button", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      DEFAULT_PRESET_COLORS.forEach((color) => {
        const button = screen.getByLabelText(`Select color ${color}`);
        expect(button).toHaveAttribute("aria-label", `Select color ${color}`);
      });
    });

    it("should have aria-label for custom color input", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      expect(screen.getByLabelText("Custom color picker")).toBeInTheDocument();
    });

    it("should have keyboard accessible preset buttons", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveClass("focus:ring-2");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle uppercase hex values", () => {
      render(<ColorPicker value="#ABCDEF" onChange={vi.fn()} />);

      const colorInput = screen.getByLabelText("Custom color picker");
      // Browsers normalize color input values to lowercase
      expect(colorInput).toHaveValue("#abcdef");
    });

    it("should handle lowercase hex values", () => {
      render(<ColorPicker value="#abcdef" onChange={vi.fn()} />);

      const colorInput = screen.getByLabelText("Custom color picker");
      expect(colorInput).toHaveValue("#abcdef");
    });

    it("should handle value not in preset colors", () => {
      render(<ColorPicker value="#999999" onChange={vi.fn()} />);

      const colorInput = screen.getByLabelText("Custom color picker");
      expect(colorInput).toHaveValue("#999999");

      // No preset button should be highlighted with selected state
      // Selected buttons have both "ring-2" and "scale-110" (not hover:scale-110)
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        // Check if it has the ring-2 class (which is only added when selected)
        // All buttons have hover:scale-110, but only selected ones have scale-110
        const classes = button.className.split(" ");
        const hasRing2 = classes.includes("ring-2");
        const hasScale110 = classes.includes("scale-110");
        expect(hasRing2 && hasScale110).toBe(false);
      });
    });

    it("should handle single preset color", () => {
      const onChange = vi.fn();
      render(<ColorPicker value="#FF0000" onChange={onChange} presetColors={["#FF0000"]} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
    });

    it("should handle many preset colors", () => {
      const manyColors = Array.from(
        { length: 20 },
        (_, i) => `#${i.toString(16).padStart(6, "0")}`,
      );

      render(<ColorPicker value="#000000" onChange={vi.fn()} presetColors={manyColors} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(20);
    });
  });

  describe("Props Combinations", () => {
    it("should work with all default props", () => {
      render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);

      expect(screen.getByText("Color")).toBeInTheDocument();
      expect(screen.getAllByRole("button")).toHaveLength(8);
    });

    it("should work with custom label and preset colors", () => {
      const customColors = ["#000000", "#FFFFFF"];
      render(
        <ColorPicker
          value="#000000"
          onChange={vi.fn()}
          label="Pick Theme"
          presetColors={customColors}
        />,
      );

      expect(screen.getByText("Pick Theme")).toBeInTheDocument();
      expect(screen.getAllByRole("button")).toHaveLength(2);
    });
  });

  describe("Real-world Scenarios", () => {
    it("should work as theme color picker", async () => {
      const user = userEvent.setup();
      let selectedColor = "#EF4444";
      const onChange = vi.fn((color) => {
        selectedColor = color;
      });

      const { rerender } = render(
        <ColorPicker value={selectedColor} onChange={onChange} label="Theme Color" />,
      );

      // Click a different color
      await user.click(screen.getByLabelText("Select color #3B82F6"));
      expect(onChange).toHaveBeenCalledWith("#3B82F6");

      // Rerender with new value
      rerender(<ColorPicker value="#3B82F6" onChange={onChange} label="Theme Color" />);

      // New color should be selected
      const selectedButton = screen.getByLabelText("Select color #3B82F6");
      expect(selectedButton).toHaveClass("scale-110");
    });

    it("should work as brand color selector", () => {
      const brandColors = ["#FF0000", "#00FF00", "#0000FF"];
      render(
        <ColorPicker
          value="#FF0000"
          onChange={vi.fn()}
          label="Brand Color"
          presetColors={brandColors}
        />,
      );

      expect(screen.getByText("Brand Color")).toBeInTheDocument();
      brandColors.forEach((color) => {
        expect(screen.getByLabelText(`Select color ${color}`)).toBeInTheDocument();
      });
    });
  });
});
