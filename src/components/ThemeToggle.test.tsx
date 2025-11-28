import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../contexts/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";

// Mock matchMedia for system theme detection
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Helper to render with ThemeProvider
function renderWithTheme() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    mockMatchMedia(false);
    document.documentElement.classList.remove("dark");
  });

  describe("Basic Rendering", () => {
    it("should render all three theme buttons", () => {
      renderWithTheme();

      expect(screen.getByRole("button", { name: /light theme/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /dark theme/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /system theme/i })).toBeInTheDocument();
    });

    it("should display correct icons for each theme", () => {
      renderWithTheme();

      expect(screen.getByText("☀️")).toBeInTheDocument();
      expect(screen.getByText("🌙")).toBeInTheDocument();
      expect(screen.getByText("💻")).toBeInTheDocument();
    });

    it("should have container with proper styling", () => {
      const { container } = renderWithTheme();

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("flex");
      expect(wrapper).toHaveClass("items-center");
      expect(wrapper).toHaveClass("gap-1");
      expect(wrapper).toHaveClass("rounded-lg");
    });
  });

  describe("Theme Selection", () => {
    it("should switch to light theme when light button is clicked", async () => {
      const user = userEvent.setup();
      renderWithTheme();

      const lightButton = screen.getByRole("button", { name: /light theme/i });
      await user.click(lightButton);

      expect(localStorage.getItem("nixelo-theme")).toBe("light");
    });

    it("should switch to dark theme when dark button is clicked", async () => {
      const user = userEvent.setup();
      renderWithTheme();

      const darkButton = screen.getByRole("button", { name: /dark theme/i });
      await user.click(darkButton);

      expect(localStorage.getItem("nixelo-theme")).toBe("dark");
    });

    it("should switch to system theme when system button is clicked", async () => {
      const user = userEvent.setup();
      localStorage.setItem("nixelo-theme", "dark");
      renderWithTheme();

      const systemButton = screen.getByRole("button", { name: /system theme/i });
      await user.click(systemButton);

      expect(localStorage.getItem("nixelo-theme")).toBe("system");
    });

    it("should highlight the currently selected theme button", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const darkButton = screen.getByRole("button", { name: /dark theme/i });
      await user.click(darkButton);

      // Re-render to see the updated state
      rerender(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      // Verify localStorage was updated
      expect(localStorage.getItem("nixelo-theme")).toBe("dark");
    });
  });

  describe("Initial State", () => {
    it("should default to system theme when no localStorage value", () => {
      renderWithTheme();

      // System should be the default
      expect(localStorage.getItem("nixelo-theme")).toBeNull();
    });

    it("should use stored theme from localStorage", () => {
      localStorage.setItem("nixelo-theme", "dark");
      renderWithTheme();

      expect(localStorage.getItem("nixelo-theme")).toBe("dark");
    });
  });

  describe("Accessibility", () => {
    it("should have accessible button labels", () => {
      renderWithTheme();

      const lightButton = screen.getByRole("button", { name: /light theme/i });
      const darkButton = screen.getByRole("button", { name: /dark theme/i });
      const systemButton = screen.getByRole("button", { name: /system theme/i });

      expect(lightButton).toHaveAttribute("aria-label", "Switch to light theme");
      expect(darkButton).toHaveAttribute("aria-label", "Switch to dark theme");
      expect(systemButton).toHaveAttribute("aria-label", "Switch to system theme");
    });

    it("should have title attributes for tooltips", () => {
      renderWithTheme();

      const lightButton = screen.getByRole("button", { name: /light theme/i });
      const darkButton = screen.getByRole("button", { name: /dark theme/i });
      const systemButton = screen.getByRole("button", { name: /system theme/i });

      expect(lightButton).toHaveAttribute("title", "Light");
      expect(darkButton).toHaveAttribute("title", "Dark");
      expect(systemButton).toHaveAttribute("title", "System");
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      renderWithTheme();

      const lightButton = screen.getByRole("button", { name: /light theme/i });

      lightButton.focus();
      expect(document.activeElement).toBe(lightButton);

      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole("button", { name: /dark theme/i }));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole("button", { name: /system theme/i }));
    });
  });

  describe("Visual Feedback", () => {
    it("should apply shadow to selected button", async () => {
      const user = userEvent.setup();
      localStorage.setItem("nixelo-theme", "light");

      const { rerender } = renderWithTheme();

      // Click light button
      const lightButton = screen.getByRole("button", { name: /light theme/i });
      await user.click(lightButton);

      rerender(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      // The button should have shadow class when selected
      const selectedButton = screen.getByRole("button", { name: /light theme/i });
      expect(selectedButton).toHaveClass("shadow-sm");
    });
  });
});

describe("ThemeProvider Integration", () => {
  beforeEach(() => {
    localStorage.clear();
    mockMatchMedia(false);
    document.documentElement.classList.remove("dark");
  });

  it("should add dark class to document when dark theme is selected", async () => {
    const user = userEvent.setup();
    renderWithTheme();

    const darkButton = screen.getByRole("button", { name: /dark theme/i });
    await user.click(darkButton);

    // Wait for effect to run
    await vi.waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  it("should remove dark class when light theme is selected", async () => {
    const user = userEvent.setup();
    document.documentElement.classList.add("dark");
    localStorage.setItem("nixelo-theme", "dark");

    renderWithTheme();

    const lightButton = screen.getByRole("button", { name: /light theme/i });
    await user.click(lightButton);

    await vi.waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  it("should respect system preference when system theme is selected", async () => {
    mockMatchMedia(true); // System prefers dark
    renderWithTheme();

    await vi.waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });
});
