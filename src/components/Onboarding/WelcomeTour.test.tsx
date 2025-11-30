import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type DriverConfig = {
  showProgress?: boolean;
  showButtons?: string[];
  steps?: Array<{
    element?: string;
    popover?: {
      title?: string;
      description?: string;
      side?: string;
      align?: string;
    };
  }>;
  onDestroyStarted?: () => void;
};

// Use vi.hoisted to create mock state that persists across parallel test execution
// This must be called before vi.mock and the state object must be returned
const mockState = vi.hoisted(() => {
  return {
    lastDriverConfig: undefined as DriverConfig | undefined,
    mockOnDestroyStarted: undefined as (() => void) | undefined,
    mockDriveCalled: false,
    mockDestroyCalled: false,
    mockUpdateOnboardingArgs: undefined as Record<string, unknown> | undefined,
    mockHasNextStep: false,
    mockHasPreviousStep: false,
    reset() {
      this.lastDriverConfig = undefined;
      this.mockOnDestroyStarted = undefined;
      this.mockDriveCalled = false;
      this.mockDestroyCalled = false;
      this.mockUpdateOnboardingArgs = undefined;
      this.mockHasNextStep = false;
      this.mockHasPreviousStep = false;
    },
  };
});

// Mock driver.js - vi.mock is hoisted so this runs before any imports
// The factory function receives the hoisted mockState
vi.mock("driver.js", async () => {
  // Create the driver factory function inside the mock
  const driverFactory = (config: DriverConfig) => {
    // Store config in hoisted mock state
    mockState.lastDriverConfig = config;
    mockState.mockOnDestroyStarted = config.onDestroyStarted;
    return {
      drive: () => {
        mockState.mockDriveCalled = true;
      },
      destroy: () => {
        mockState.mockDestroyCalled = true;
      },
      hasNextStep: () => mockState.mockHasNextStep,
      hasPreviousStep: () => mockState.mockHasPreviousStep,
    };
  };

  return {
    driver: driverFactory,
    default: { driver: driverFactory },
  };
});

// Mock driver.js CSS import
vi.mock("driver.js/dist/driver.css", () => ({}));

// Mock Convex
vi.mock("convex/react", () => ({
  useMutation: () => (args: unknown) => {
    mockState.mockUpdateOnboardingArgs = args as Record<string, unknown>;
    return Promise.resolve();
  },
}));

// Import after mocking
import { WelcomeTour } from "./WelcomeTour";

// Helper functions to access mock state
const getLastDriverConfig = () => mockState.lastDriverConfig;
const getMockOnDestroyStarted = () => mockState.mockOnDestroyStarted;
const wasDriveCalled = () => mockState.mockDriveCalled;
const wasDestroyCalled = () => mockState.mockDestroyCalled;
const getUpdateOnboardingArgs = () => mockState.mockUpdateOnboardingArgs;
const setMockHasNextStep = (value: boolean) => {
  mockState.mockHasNextStep = value;
};
const setMockHasPreviousStep = (value: boolean) => {
  mockState.mockHasPreviousStep = value;
};

describe("WelcomeTour", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockState.reset();
  });

  // Helper to wait for driver to be initialized (after dynamic import completes)
  async function waitForDriverInit() {
    await waitFor(
      () => {
        expect(getLastDriverConfig()).toBeDefined();
      },
      { timeout: 2000 },
    );
  }

  // Helper to wait for tour to start (after 500ms setTimeout)
  async function waitForTourStart() {
    await waitFor(
      () => {
        expect(wasDriveCalled()).toBe(true);
      },
      { timeout: 2000 },
    );
  }

  it("should initialize driver with correct configuration", async () => {
    render(<WelcomeTour />);
    await waitForDriverInit();

    const config = getLastDriverConfig();
    expect(config).toBeDefined();
    expect(config!.showProgress).toBe(true);
    expect(config!.showButtons).toEqual(["next", "previous", "close"]);
    expect(config!.steps).toHaveLength(8);
  });

  it("should have correct tour steps", async () => {
    render(<WelcomeTour />);
    await waitForDriverInit();

    const config = getLastDriverConfig();
    const steps = config!.steps!;

    // Check step titles (component has 8 steps)
    expect(steps[0].popover?.title).toBe("Welcome to Nixelo! 🎉");
    expect(steps[1].popover?.title).toBe("⌘K Command Palette");
    expect(steps[2].popover?.title).toBe("Create Your First Project");
    expect(steps[3].popover?.title).toBe("Your Dashboard");
    expect(steps[4].popover?.title).toBe("Kanban Board");
    expect(steps[5].popover?.title).toBe("Create Issues");
    expect(steps[6].popover?.title).toBe("Document Sidebar");
    expect(steps[7].popover?.title).toBe("Ready to Get Started? 🚀");
  });

  it("should start tour after delay", async () => {
    render(<WelcomeTour />);
    await waitForTourStart();

    expect(getLastDriverConfig()).toBeDefined();
    expect(wasDriveCalled()).toBe(true);
  });

  it("should call onComplete when tour is completed", async () => {
    const mockOnComplete = vi.fn();
    render(<WelcomeTour onComplete={mockOnComplete} />);
    await waitForTourStart();

    // Simulate tour completion (no more steps)
    setMockHasNextStep(false);
    setMockHasPreviousStep(false);

    // Trigger onDestroyStarted
    const onDestroyStarted = getMockOnDestroyStarted();
    act(() => {
      onDestroyStarted!();
    });

    expect(mockOnComplete).toHaveBeenCalled();
    expect(getUpdateOnboardingArgs()).toEqual({
      tourShown: true,
      onboardingStep: 2,
      onboardingCompleted: false,
    });
  });

  it("should call onSkip when tour is skipped", async () => {
    const mockOnSkip = vi.fn();
    render(<WelcomeTour onSkip={mockOnSkip} />);
    await waitForTourStart();

    // Simulate tour being skipped (has next/previous steps)
    setMockHasNextStep(true);
    setMockHasPreviousStep(false);

    // Trigger onDestroyStarted
    const onDestroyStarted = getMockOnDestroyStarted();
    act(() => {
      onDestroyStarted!();
    });

    expect(mockOnSkip).toHaveBeenCalled();
    expect(getUpdateOnboardingArgs()).toEqual({
      tourShown: true,
      onboardingStep: 2,
    });
  });

  it("should update onboarding status when tour is completed", async () => {
    render(<WelcomeTour />);
    await waitForTourStart();

    setMockHasNextStep(false);
    setMockHasPreviousStep(false);

    const onDestroyStarted = getMockOnDestroyStarted();
    act(() => {
      onDestroyStarted!();
    });

    expect(getUpdateOnboardingArgs()).toEqual({
      tourShown: true,
      onboardingStep: 2,
      onboardingCompleted: false,
    });
  });

  it("should update onboarding status when tour is skipped", async () => {
    render(<WelcomeTour />);
    await waitForTourStart();

    setMockHasNextStep(true);

    const onDestroyStarted = getMockOnDestroyStarted();
    act(() => {
      onDestroyStarted!();
    });

    expect(getUpdateOnboardingArgs()).toEqual({
      tourShown: true,
      onboardingStep: 2,
    });
  });

  it("should destroy driver on cleanup", async () => {
    const { unmount } = render(<WelcomeTour />);
    await waitForDriverInit();

    unmount();

    expect(wasDestroyCalled()).toBe(true);
  });

  it("should render null (no visual output)", () => {
    const { container } = render(<WelcomeTour />);
    expect(container.firstChild).toBeNull();
  });

  it("should handle completion without onComplete callback", async () => {
    render(<WelcomeTour />);
    await waitForTourStart();

    setMockHasNextStep(false);
    setMockHasPreviousStep(false);

    // Should not throw error
    const onDestroyStarted = getMockOnDestroyStarted();
    expect(() => {
      act(() => {
        onDestroyStarted!();
      });
    }).not.toThrow();
  });

  it("should handle skip without onSkip callback", async () => {
    render(<WelcomeTour />);
    await waitForTourStart();

    setMockHasNextStep(true);

    // Should not throw error
    const onDestroyStarted = getMockOnDestroyStarted();
    expect(() => {
      act(() => {
        onDestroyStarted!();
      });
    }).not.toThrow();
  });

  it("should call destroy on driver when tour ends", async () => {
    render(<WelcomeTour />);
    await waitForTourStart();

    setMockHasNextStep(false);
    setMockHasPreviousStep(false);

    const onDestroyStarted = getMockOnDestroyStarted();
    act(() => {
      onDestroyStarted!();
    });

    expect(wasDestroyCalled()).toBe(true);
  });

  it("should have command palette step with keyboard shortcuts", async () => {
    render(<WelcomeTour />);
    await waitForDriverInit();

    const config = getLastDriverConfig();
    const commandPaletteStep = config!.steps![1];

    expect(commandPaletteStep.element).toBe("[data-tour='command-palette']");
    expect(commandPaletteStep.popover!.description).toContain("⌘K");
    expect(commandPaletteStep.popover!.description).toContain("Ctrl+K");
  });

  it("should have create project step", async () => {
    render(<WelcomeTour />);
    await waitForDriverInit();

    const config = getLastDriverConfig();
    const createProjectStep = config!.steps![2];

    expect(createProjectStep.element).toBe("[data-tour='create-project']");
    expect(createProjectStep.popover!.title).toBe("Create Your First Project");
  });

  it("should have dashboard step", async () => {
    render(<WelcomeTour />);
    await waitForDriverInit();

    const config = getLastDriverConfig();
    const dashboardStep = config!.steps![3];

    expect(dashboardStep.element).toBe("[data-tour='dashboard']");
    expect(dashboardStep.popover!.title).toBe("Your Dashboard");
  });

  it("should have sidebar step", async () => {
    render(<WelcomeTour />);
    await waitForDriverInit();

    const config = getLastDriverConfig();
    // Sidebar is step 6 (index 6) in the 8-step tour
    const sidebarStep = config!.steps![6];

    expect(sidebarStep.element).toBe("[data-tour='sidebar']");
    expect(sidebarStep.popover!.title).toBe("Document Sidebar");
  });

  it("should set onboardingCompleted to false on completion", async () => {
    render(<WelcomeTour />);
    await waitForTourStart();

    setMockHasNextStep(false);
    setMockHasPreviousStep(false);

    const onDestroyStarted = getMockOnDestroyStarted();
    act(() => {
      onDestroyStarted!();
    });

    const callArgs = getUpdateOnboardingArgs();
    expect(callArgs?.onboardingCompleted).toBe(false);
  });

  it("should not set onboardingCompleted when skipped", async () => {
    render(<WelcomeTour />);
    await waitForTourStart();

    setMockHasNextStep(true);

    const onDestroyStarted = getMockOnDestroyStarted();
    act(() => {
      onDestroyStarted!();
    });

    const callArgs = getUpdateOnboardingArgs();
    expect(callArgs?.onboardingCompleted).toBeUndefined();
  });

  it("should have correct popover positioning", async () => {
    render(<WelcomeTour />);
    await waitForDriverInit();

    const config = getLastDriverConfig();
    const steps = config!.steps!;
    expect(steps[0].popover!.side).toBe("top");
    expect(steps[1].popover!.side).toBe("bottom");
    expect(steps[2].popover!.side).toBe("bottom");
    expect(steps[3].popover!.side).toBe("left");
    expect(steps[4].popover!.side).toBe("top");
    expect(steps[5].popover!.side).toBe("left");
    expect(steps[6].popover!.side).toBe("right");
    expect(steps[7].popover!.side).toBe("top");
  });

  it("should detect skip when user closes tour with previous step available", async () => {
    render(<WelcomeTour />);
    await waitForTourStart();

    setMockHasNextStep(false);
    setMockHasPreviousStep(true);

    const onDestroyStarted = getMockOnDestroyStarted();
    act(() => {
      onDestroyStarted!();
    });

    // Should be treated as skip because hasPreviousStep is true
    expect(getUpdateOnboardingArgs()).toEqual({
      tourShown: true,
      onboardingStep: 2,
    });
  });
});
