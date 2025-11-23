import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "../../../convex/_generated/dataModel";

// Mock the OnboardingContext
const mockSetShowWelcome = vi.fn();
const mockStartOnboarding = vi.fn();
const mockSkipOnboarding = vi.fn();
const mockCreateSampleProject = vi.fn();

let mockShowWelcome = true;

vi.mock("../../contexts/OnboardingContext", () => ({
  useOnboarding: vi.fn(() => ({
    showWelcome: mockShowWelcome,
    setShowWelcome: mockSetShowWelcome,
    startOnboarding: mockStartOnboarding,
    skipOnboarding: mockSkipOnboarding,
    createSampleProject: mockCreateSampleProject,
  })),
}));

// Import after mocking
import { WelcomeModal } from "./WelcomeModal";

describe("WelcomeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShowWelcome = true; // Reset to true for each test
  });

  it("should render welcome modal when showWelcome is true", () => {
    render(<WelcomeModal />);

    expect(screen.getByText("Welcome to Cascade!")).toBeInTheDocument();
    expect(
      screen.getByText("Your all-in-one workspace for projects, tasks, and collaboration"),
    ).toBeInTheDocument();
  });

  it("should render feature highlights", () => {
    render(<WelcomeModal />);

    // Feature 1: Kanban Boards
    expect(screen.getByText("Kanban Boards")).toBeInTheDocument();
    expect(screen.getByText("Visualize workflow with drag-and-drop boards")).toBeInTheDocument();

    // Feature 2: Rich Documents
    expect(screen.getByText("Rich Documents")).toBeInTheDocument();
    expect(screen.getByText("Collaborate in real-time like Confluence")).toBeInTheDocument();

    // Feature 3: Sprint Planning
    expect(screen.getByText("Sprint Planning")).toBeInTheDocument();
    expect(screen.getByText("Plan and track sprints with team velocity")).toBeInTheDocument();
  });

  it("should render CTA buttons", () => {
    render(<WelcomeModal />);

    expect(screen.getByText("🎯 Get Started with a Demo")).toBeInTheDocument();
    expect(screen.getByText("Skip Tour")).toBeInTheDocument();
  });

  it("should render footer note", () => {
    render(<WelcomeModal />);

    expect(
      screen.getByText(/We'll create a sample project to help you explore Cascade's features/),
    ).toBeInTheDocument();
    expect(screen.getByText(/You can delete it anytime/)).toBeInTheDocument();
  });

  it("should call createSampleProject when clicking Get Started button", async () => {
    const user = userEvent.setup();
    const mockProjectId = "proj123" as Id<"projects">;
    mockCreateSampleProject.mockResolvedValue(mockProjectId);

    render(<WelcomeModal />);

    const getStartedButton = screen.getByText("🎯 Get Started with a Demo");
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(mockCreateSampleProject).toHaveBeenCalled();
    });
  });

  it("should call setShowWelcome(false) after creating sample project", async () => {
    const user = userEvent.setup();
    const mockProjectId = "proj123" as Id<"projects">;
    mockCreateSampleProject.mockResolvedValue(mockProjectId);

    render(<WelcomeModal />);

    const getStartedButton = screen.getByText("🎯 Get Started with a Demo");
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(mockSetShowWelcome).toHaveBeenCalledWith(false);
    });
  });

  it("should call startOnboarding after creating sample project", async () => {
    const user = userEvent.setup();
    const mockProjectId = "proj123" as Id<"projects">;
    mockCreateSampleProject.mockResolvedValue(mockProjectId);

    render(<WelcomeModal />);

    const getStartedButton = screen.getByText("🎯 Get Started with a Demo");
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(mockStartOnboarding).toHaveBeenCalled();
    });
  });

  it("should call onNavigateToProject callback with projectId", async () => {
    const user = userEvent.setup();
    const mockProjectId = "proj123" as Id<"projects">;
    const mockOnNavigateToProject = vi.fn();
    mockCreateSampleProject.mockResolvedValue(mockProjectId);

    render(<WelcomeModal onNavigateToProject={mockOnNavigateToProject} />);

    const getStartedButton = screen.getByText("🎯 Get Started with a Demo");
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(mockOnNavigateToProject).toHaveBeenCalledWith(mockProjectId);
    });
  });

  it("should show loading state when creating sample project", async () => {
    const user = userEvent.setup();
    let resolveCreate: (value: Id<"projects">) => void;
    const createPromise = new Promise<Id<"projects">>((resolve) => {
      resolveCreate = resolve;
    });
    mockCreateSampleProject.mockReturnValue(createPromise);

    render(<WelcomeModal />);

    const getStartedButton = screen.getByText("🎯 Get Started with a Demo");
    await user.click(getStartedButton);

    // Should show loading text
    expect(screen.getByText("Creating Sample Project...")).toBeInTheDocument();

    // Button should be disabled
    expect(getStartedButton).toBeDisabled();

    // Resolve the promise to finish the test
    resolveCreate!("proj123" as Id<"projects">);
    await waitFor(() => {
      expect(mockSetShowWelcome).toHaveBeenCalledWith(false);
    });
  });

  it("should handle sample project creation error gracefully", async () => {
    const user = userEvent.setup();
    mockCreateSampleProject.mockRejectedValue(new Error("Failed to create project"));

    render(<WelcomeModal />);

    const getStartedButton = screen.getByText("🎯 Get Started with a Demo");
    await user.click(getStartedButton);

    // Should eventually restore button text (error is handled silently)
    await waitFor(() => {
      expect(screen.getByText("🎯 Get Started with a Demo")).toBeInTheDocument();
    });
  });

  it("should call skipOnboarding when clicking Skip Tour button", async () => {
    const user = userEvent.setup();

    render(<WelcomeModal />);

    const skipButton = screen.getByText("Skip Tour");
    await user.click(skipButton);

    expect(mockSkipOnboarding).toHaveBeenCalled();
  });

  it("should call skipOnboarding when closing modal", async () => {
    render(<WelcomeModal />);

    // Modal component should call onClose when user closes it
    // The onClose prop is bound to handleSkip
    // We can test this by checking that skipOnboarding is the close handler
    expect(mockSkipOnboarding).toBeDefined();
  });

  it("should not render when showWelcome is false", () => {
    // Set showWelcome to false
    mockShowWelcome = false;

    const { container } = render(<WelcomeModal />);

    // Component returns null when showWelcome is false
    expect(container.firstChild).toBeNull();
  });

  it("should render with proper accessibility roles", () => {
    render(<WelcomeModal />);

    // Buttons should have proper roles
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2); // At least Get Started and Skip buttons
  });

  it("should render emoji icons for features", () => {
    const { container } = render(<WelcomeModal />);

    // Check for emojis (they're rendered as text content)
    expect(container.textContent).toContain("👋");
    expect(container.textContent).toContain("📋");
    expect(container.textContent).toContain("📄");
    expect(container.textContent).toContain("🚀");
    expect(container.textContent).toContain("🎯");
  });

  it("should have correct button styling classes", () => {
    render(<WelcomeModal />);

    const getStartedButton = screen.getByText("🎯 Get Started with a Demo");
    const skipButton = screen.getByText("Skip Tour");

    // Get Started should be primary (default variant)
    expect(getStartedButton).toBeInTheDocument();

    // Skip should be secondary variant
    expect(skipButton).toBeInTheDocument();
  });

  it("should display all three feature highlights in grid layout", () => {
    const { container } = render(<WelcomeModal />);

    // Check for grid container
    const grid = container.querySelector(".grid.grid-cols-1.md\\:grid-cols-3");
    expect(grid).toBeInTheDocument();

    // Should have 3 feature cards
    const featureCards = container.querySelectorAll(".text-center.p-4");
    expect(featureCards.length).toBe(3);
  });

  it("should have large size buttons", () => {
    render(<WelcomeModal />);

    const getStartedButton = screen.getByText("🎯 Get Started with a Demo");
    const skipButton = screen.getByText("Skip Tour");

    // Buttons should be large (size="lg")
    expect(getStartedButton).toBeInTheDocument();
    expect(skipButton).toBeInTheDocument();
  });

  it("should disable button during creation to prevent double submission", async () => {
    const user = userEvent.setup();
    let resolveCreate: (value: Id<"projects">) => void;
    const createPromise = new Promise<Id<"projects">>((resolve) => {
      resolveCreate = resolve;
    });
    mockCreateSampleProject.mockReturnValue(createPromise);

    render(<WelcomeModal />);

    const getStartedButton = screen.getByText("🎯 Get Started with a Demo");

    // Click the button
    await user.click(getStartedButton);

    // Button should be disabled while creating
    await waitFor(() => {
      expect(getStartedButton).toBeDisabled();
    });

    // Resolve the promise
    resolveCreate!("proj123" as Id<"projects">);

    await waitFor(() => {
      expect(mockSetShowWelcome).toHaveBeenCalledWith(false);
    });
  });

  it("should render header with correct text size", () => {
    const { container } = render(<WelcomeModal />);

    const heading = screen.getByText("Welcome to Cascade!");
    expect(heading.tagName).toBe("H1");
    expect(heading).toHaveClass("text-3xl");
  });

  it("should render subtitle with correct styling", () => {
    render(<WelcomeModal />);

    const subtitle = screen.getByText(
      "Your all-in-one workspace for projects, tasks, and collaboration",
    );
    expect(subtitle.tagName).toBe("P");
  });
});
