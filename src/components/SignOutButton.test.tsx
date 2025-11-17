import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignOutButton } from "../SignOutButton";

// Mock sign out function
const mockSignOut = vi.fn();

// Create a mocked auth state that can be changed
let mockIsAuthenticated = true;

// Mock Convex auth hooks
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    isLoading: false,
  }),
}));

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({
    signOut: mockSignOut,
  }),
}));

describe("SignOutButton", () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    mockIsAuthenticated = true; // Reset to authenticated state
  });

  it("should render sign out button when authenticated", () => {
    render(<SignOutButton />);
    const button = screen.getByRole("button", { name: /sign out/i });
    expect(button).toBeInTheDocument();
  });

  it("should call signOut when clicked", async () => {
    const user = userEvent.setup();

    render(<SignOutButton />);
    const button = screen.getByRole("button", { name: /sign out/i });

    await user.click(button);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("should have proper styling classes", () => {
    render(<SignOutButton />);
    const button = screen.getByRole("button", { name: /sign out/i });

    // Check that button has some expected classes
    expect(button.className).toContain("px-");
    expect(button.className).toContain("py-");
  });

  it("should return null when not authenticated", () => {
    // Set the mock to unauthenticated state
    mockIsAuthenticated = false;

    const { container } = render(<SignOutButton />);

    // Should not render anything
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
