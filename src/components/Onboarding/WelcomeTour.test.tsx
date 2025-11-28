import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock driver.js
const mockDrive = vi.fn();
const mockDestroy = vi.fn();
const mockHasNextStep = vi.fn();
const mockHasPreviousStep = vi.fn();

let mockOnDestroyStarted: (() => void) | undefined;
let lastDriverConfig: any;

vi.mock("driver.js", () => ({
  driver: vi.fn((config: any) => {
    lastDriverConfig = config;
    mockOnDestroyStarted = config.onDestroyStarted;
    return {
      drive: mockDrive,
      destroy: mockDestroy,
      hasNextStep: mockHasNextStep,
      hasPreviousStep: mockHasPreviousStep,
    };
  }),
}));

// Mock driver.js CSS import
vi.mock("driver.js/dist/driver.css", () => ({}));

// Mock Convex
const mockUpdateOnboarding = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => mockUpdateOnboarding),
}));

// Import after mocking
import { driver } from "driver.js";
import { WelcomeTour } from "./WelcomeTour";

const mockDriver = driver as ReturnType<typeof vi.fn>;

describe("WelcomeTour", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockOnDestroyStarted = undefined;
    lastDriverConfig = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize driver with correct configuration", async () => {
    render(<WelcomeTour />);

    // Wait for driver to be lazy loaded
    await waitFor(() => {
      expect(mockDriver).toHaveBeenCalled();
    });

    expect(lastDriverConfig).toBeDefined();
    expect(lastDriverConfig.showProgress).toBe(true);
    expect(lastDriverConfig.showButtons).toEqual(["next", "previous", "close"]);
    expect(lastDriverConfig.steps).toHaveLength(6);
  });

  it("should have correct tour steps", async () => {
    render(<WelcomeTour />);

    // Wait for driver to be lazy loaded
    await waitFor(() => {
      expect(mockDriver).toHaveBeenCalled();
    });

    const steps = lastDriverConfig.steps;

    // Check step titles
    expect(steps[0].popover.title).toBe("Welcome to Nixelo! 🎉");
    expect(steps[1].popover.title).toBe("⌘K Command Palette");
    expect(steps[2].popover.title).toBe("Create Your First Project");
    expect(steps[3].popover.title).toBe("Your Dashboard");
    expect(steps[4].popover.title).toBe("Document Sidebar");
    expect(steps[5].popover.title).toBe("Ready to Get Started? 🚀");
  });

  it("should start tour after 500ms delay", async () => {
    render(<WelcomeTour />);

    // Wait for driver to load
    await waitFor(() => {
      expect(mockDriver).toHaveBeenCalled();
    });

    // Drive should not have been called yet
    expect(mockDrive).not.toHaveBeenCalled();

    // Fast-forward 500ms
    vi.advanceTimersByTime(500);

    // Now drive should be called
    await waitFor(() => {
      expect(mockDrive).toHaveBeenCalled();
    });
  });

  it("should call onComplete when tour is completed", async () => {
    const mockOnComplete = vi.fn();
    render(<WelcomeTour onComplete={mockOnComplete} />);

    // Wait for driver to load
    await waitFor(() => {
      expect(mockDriver).toHaveBeenCalled();
    });

    // Fast-forward to start tour
    vi.advanceTimersByTime(500);

    // Simulate tour completion (no more steps)
    mockHasNextStep.mockReturnValue(false);
    mockHasPreviousStep.mockReturnValue(false);

    // Trigger onDestroyStarted
    if (mockOnDestroyStarted) {
      mockOnDestroyStarted();
    }

    expect(mockOnComplete).toHaveBeenCalled();
    expect(mockUpdateOnboarding).toHaveBeenCalledWith({
      tourShown: true,
      onboardingStep: 2,
      onboardingCompleted: false,
    });
  });

  it("should call onSkip when tour is skipped", async () => {
    const mockOnSkip = vi.fn();
    render(<WelcomeTour onSkip={mockOnSkip} />);

    // Wait for driver to load
    await waitFor(() => {
      expect(mockDriver).toHaveBeenCalled();
    });

    // Fast-forward to start tour
    vi.advanceTimersByTime(500);

    // Simulate tour being skipped (has next/previous steps)
    mockHasNextStep.mockReturnValue(true);
    mockHasPreviousStep.mockReturnValue(false);

    // Trigger onDestroyStarted
    if (mockOnDestroyStarted) {
      mockOnDestroyStarted();
    }

    expect(mockOnSkip).toHaveBeenCalled();
    expect(mockUpdateOnboarding).toHaveBeenCalledWith({
      tourShown: true,
      onboardingStep: 2,
    });
  });

  it("should update onboarding status when tour is completed", async () => {
    render(<WelcomeTour />);

    // Wait for driver to load
    await waitFor(() => {
      expect(mockDriver).toHaveBeenCalled();
    });

    vi.advanceTimersByTime(500);

    mockHasNextStep.mockReturnValue(false);
    mockHasPreviousStep.mockReturnValue(false);

    if (mockOnDestroyStarted) {
      mockOnDestroyStarted();
    }

    expect(mockUpdateOnboarding).toHaveBeenCalledWith({
      tourShown: true,
      onboardingStep: 2,
      onboardingCompleted: false,
    });
  });

  it("should update onboarding status when tour is skipped", async () => {
    render(<WelcomeTour />);

    // Wait for driver to load
    await waitFor(() => {
      expect(mockDriver).toHaveBeenCalled();
    });

    vi.advanceTimersByTime(500);

    mockHasNextStep.mockReturnValue(true);

    if (mockOnDestroyStarted) {
      mockOnDestroyStarted();
    }

    expect(mockUpdateOnboarding).toHaveBeenCalledWith({
      tourShown: true,
      onboardingStep: 2,
    });
  });

  it("should destroy driver on cleanup", () => {
    const { unmount } = render(<WelcomeTour />);

    unmount();

    expect(mockDestroy).toHaveBeenCalled();
  });

  it("should clear timeout on cleanup before tour starts", () => {
    const { unmount } = render(<WelcomeTour />);

    // Unmount before 500ms passes
    vi.advanceTimersByTime(250);
    unmount();

    // Tour should not have started
    expect(mockDrive).not.toHaveBeenCalled();
  });

  it("should render null (no visual output)", () => {
    const { container } = render(<WelcomeTour />);

    expect(container.firstChild).toBeNull();
  });

  it("should handle completion without onComplete callback", () => {
    render(<WelcomeTour />);

    vi.advanceTimersByTime(500);

    mockHasNextStep.mockReturnValue(false);
    mockHasPreviousStep.mockReturnValue(false);

    // Should not throw error
    expect(() => {
      if (mockOnDestroyStarted) {
        mockOnDestroyStarted();
      }
    }).not.toThrow();
  });

  it("should handle skip without onSkip callback", () => {
    render(<WelcomeTour />);

    vi.advanceTimersByTime(500);

    mockHasNextStep.mockReturnValue(true);

    // Should not throw error
    expect(() => {
      if (mockOnDestroyStarted) {
        mockOnDestroyStarted();
      }
    }).not.toThrow();
  });

  it("should call destroy on driver when tour ends", async () => {
    render(<WelcomeTour />);

    // Wait for driver to load
    await waitFor(() => {
      expect(mockDriver).toHaveBeenCalled();
    });

    vi.advanceTimersByTime(500);

    mockHasNextStep.mockReturnValue(false);
    mockHasPreviousStep.mockReturnValue(false);

    if (mockOnDestroyStarted) {
      mockOnDestroyStarted();
    }

    expect(mockDestroy).toHaveBeenCalled();
  });

  it("should have command palette step with keyboard shortcuts", async () => {
    render(<WelcomeTour />);

    // Wait for driver to load
    await waitFor(() => {
      expect(mockDriver).toHaveBeenCalled();
    });

    const commandPaletteStep = lastDriverConfig.steps[1];

    expect(commandPaletteStep.element).toBe("[data-tour='command-palette']");
    expect(commandPaletteStep.popover.description).toContain("⌘K");
    expect(commandPaletteStep.popover.description).toContain("Ctrl+K");
  });

  it("should have create project step", async () => {
    render(<WelcomeTour />);

    // Wait for driver to load
    await waitFor(() => {
      expect(mockDriver).toHaveBeenCalled();
    });

    const createProjectStep = lastDriverConfig.steps[2];

    expect(createProjectStep.element).toBe("[data-tour='create-project']");
    expect(createProjectStep.popover.title).toBe("Create Your First Project");
  });

  it("should have dashboard step", async () => {
    render(<WelcomeTour />);

    // Wait for driver to load
    await waitFor(() => {
      expect(mockDriver).toHaveBeenCalled();
    });

    const dashboardStep = lastDriverConfig.steps[3];

    expect(dashboardStep.element).toBe("[data-tour='dashboard']");
    expect(dashboardStep.popover.title).toBe("Your Dashboard");
  });

  it("should have sidebar step", async () => {
    render(<WelcomeTour />);

    // Wait for driver to load
    await waitFor(() => {
      expect(mockDriver).toHaveBeenCalled();
    });

    const sidebarStep = lastDriverConfig.steps[4];

    expect(sidebarStep.element).toBe("[data-tour='sidebar']");
    expect(sidebarStep.popover.title).toBe("Document Sidebar");
  });

  it("should set onboardingCompleted to false on completion", async () => {
    render(<WelcomeTour />);

    // Wait for driver to load
    await waitFor(() => {
      expect(mockDriver).toHaveBeenCalled();
    });

    vi.advanceTimersByTime(500);

    mockHasNextStep.mockReturnValue(false);
    mockHasPreviousStep.mockReturnValue(false);

    if (mockOnDestroyStarted) {
      mockOnDestroyStarted();
    }

    const callArgs = mockUpdateOnboarding.mock.calls[0][0];
    expect(callArgs.onboardingCompleted).toBe(false);
  });

  it("should not set onboardingCompleted when skipped", async () => {
    render(<WelcomeTour />);

    // Wait for driver to load
    await waitFor(() => {
      expect(mockDriver).toHaveBeenCalled();
    });

    vi.advanceTimersByTime(500);

    mockHasNextStep.mockReturnValue(true);

    if (mockOnDestroyStarted) {
      mockOnDestroyStarted();
    }

    const callArgs = mockUpdateOnboarding.mock.calls[0][0];
    expect(callArgs.onboardingCompleted).toBeUndefined();
  });

  it("should have correct popover positioning", async () => {
    render(<WelcomeTour />);

    // Wait for driver to load
    await waitFor(() => {
      expect(mockDriver).toHaveBeenCalled();
    });

    expect(lastDriverConfig.steps[0].popover.side).toBe("top");
    expect(lastDriverConfig.steps[1].popover.side).toBe("bottom");
    expect(lastDriverConfig.steps[2].popover.side).toBe("bottom");
    expect(lastDriverConfig.steps[3].popover.side).toBe("left");
    expect(lastDriverConfig.steps[4].popover.side).toBe("right");
  });

  it("should detect skip when user closes tour with previous step available", async () => {
    render(<WelcomeTour />);

    // Wait for driver to load
    await waitFor(() => {
      expect(mockDriver).toHaveBeenCalled();
    });

    vi.advanceTimersByTime(500);

    mockHasNextStep.mockReturnValue(false);
    mockHasPreviousStep.mockReturnValue(true);

    if (mockOnDestroyStarted) {
      mockOnDestroyStarted();
    }

    // Should be treated as skip because hasPreviousStep is true
    expect(mockUpdateOnboarding).toHaveBeenCalledWith({
      tourShown: true,
      onboardingStep: 2,
    });
  });
});
