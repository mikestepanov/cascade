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

// Mock driver.js - vi.mock is hoisted so this runs before any imports
vi.mock("driver.js", () => {
  // Create the driver factory function inside the mock
  const driverFactory = (config: DriverConfig) => {
    // Store config in a way that's accessible from tests
    (globalThis as Record<string, unknown>).__lastDriverConfig = config;
    (globalThis as Record<string, unknown>).__mockOnDestroyStarted = config.onDestroyStarted;
    return {
      drive: () => {
        (globalThis as Record<string, unknown>).__mockDriveCalled = true;
      },
      destroy: () => {
        (globalThis as Record<string, unknown>).__mockDestroyCalled = true;
      },
      hasNextStep: () => (globalThis as Record<string, unknown>).__mockHasNextStep ?? false,
      hasPreviousStep: () => (globalThis as Record<string, unknown>).__mockHasPreviousStep ?? false,
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
    (globalThis as Record<string, unknown>).__mockUpdateOnboardingArgs = args;
    return Promise.resolve();
  },
}));

// Import after mocking
import { WelcomeTour } from "./WelcomeTour";

// Helper to get values from globalThis
const getLastDriverConfig = () =>
  (globalThis as Record<string, unknown>).__lastDriverConfig as DriverConfig | undefined;
const getMockOnDestroyStarted = () =>
  (globalThis as Record<string, unknown>).__mockOnDestroyStarted as (() => void) | undefined;
const wasDriveCalled = () =>
  (globalThis as Record<string, unknown>).__mockDriveCalled as boolean | undefined;
const wasDestroyCalled = () =>
  (globalThis as Record<string, unknown>).__mockDestroyCalled as boolean | undefined;
const getUpdateOnboardingArgs = () =>
  (globalThis as Record<string, unknown>).__mockUpdateOnboardingArgs as
    | Record<string, unknown>
    | undefined;
const setMockHasNextStep = (value: boolean) => {
  (globalThis as Record<string, unknown>).__mockHasNextStep = value;
};
const setMockHasPreviousStep = (value: boolean) => {
  (globalThis as Record<string, unknown>).__mockHasPreviousStep = value;
};

// Helper to reset globalThis mock values
function resetGlobalMocks() {
  delete (globalThis as Record<string, unknown>).__lastDriverConfig;
  delete (globalThis as Record<string, unknown>).__mockOnDestroyStarted;
  delete (globalThis as Record<string, unknown>).__mockDriveCalled;
  delete (globalThis as Record<string, unknown>).__mockDestroyCalled;
  delete (globalThis as Record<string, unknown>).__mockUpdateOnboardingArgs;
  delete (globalThis as Record<string, unknown>).__mockHasNextStep;
  delete (globalThis as Record<string, unknown>).__mockHasPreviousStep;
}

describe("WelcomeTour", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGlobalMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetGlobalMocks();
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
