import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignOutButton } from "../SignOutButton";

// Mock sign out function
const mockSignOut = vi.fn();

// Mock Convex auth hooks
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({
    isAuthenticated: true,
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
});
