import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock driver.js CSS import
vi.mock("driver.js/dist/driver.css", () => ({}));

// Mock Convex
vi.mock("convex/react", () => ({
  useMutation: () => vi.fn().mockResolvedValue(undefined),
}));

// Mock driver.js with a simple implementation
// Dynamic imports are difficult to mock reliably with fake timers
vi.mock("driver.js", () => ({
  driver: vi.fn().mockReturnValue({
    drive: vi.fn(),
    destroy: vi.fn(),
    hasNextStep: vi.fn().mockReturnValue(false),
    hasPreviousStep: vi.fn().mockReturnValue(false),
  }),
}));

// Import after mocking
import { WelcomeTour } from "./WelcomeTour";

describe("WelcomeTour", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render null (no visual output)", () => {
    const { container } = render(<WelcomeTour />);
    expect(container.firstChild).toBeNull();
  });

  it("should accept onComplete prop without error", () => {
    const mockOnComplete = vi.fn();
    expect(() => {
      render(<WelcomeTour onComplete={mockOnComplete} />);
    }).not.toThrow();
  });

  it("should accept onSkip prop without error", () => {
    const mockOnSkip = vi.fn();
    expect(() => {
      render(<WelcomeTour onSkip={mockOnSkip} />);
    }).not.toThrow();
  });

  it("should accept both callbacks without error", () => {
    const mockOnComplete = vi.fn();
    const mockOnSkip = vi.fn();
    expect(() => {
      render(<WelcomeTour onComplete={mockOnComplete} onSkip={mockOnSkip} />);
    }).not.toThrow();
  });

  it("should unmount cleanly", () => {
    const { unmount } = render(<WelcomeTour />);
    expect(() => {
      unmount();
    }).not.toThrow();
  });

  it("should render without any props", () => {
    expect(() => {
      render(<WelcomeTour />);
    }).not.toThrow();
  });
});
