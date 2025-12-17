import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProfileContent } from "./ProfileContent";

// Mock dependencies
const mockUser = {
  _id: "user123",
  name: "Test User",
  email: "test@example.com",
  image: "https://example.com/avatar.jpg",
  emailVerificationTime: 1234567890,
};

const mockStats = {
  projects: 5,
  issuesCreated: 10,
  issuesAssigned: 3,
  issuesCompleted: 7,
  comments: 42,
};

const mockUpdateProfile = vi.fn();

// Mock convex/react hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn((query) => {
    if (query === "api.users.getCurrent") return mockUser;
    if (query === "api.users.getUserStats") return mockStats;
    if (query === "skip") return undefined;
    // For get user by ID
    return mockUser;
  }),
  useMutation: vi.fn(() => mockUpdateProfile),
}));

// Mock API
vi.mock("@convex/_generated/api", () => ({
  api: {
    users: {
      getCurrent: "api.users.getCurrent",
      get: "api.users.get",
      getUserStats: "api.users.getUserStats",
      updateProfile: "api.users.updateProfile",
    },
  },
}));

describe("ProfileContent", () => {
  it("renders user info and stats", () => {
    render(<ProfileContent />);

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("Workspaces")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // Project count
  });

  it("allows editing profile", async () => {
    const user = userEvent.setup();
    render(<ProfileContent />);

    // Click Edit
    const editButton = screen.getByText("Edit Profile");
    await user.click(editButton);

    // Check if inputs appear
    const nameInput = screen.getByLabelText("Name");
    const emailInput = screen.getByLabelText("Email");

    expect(nameInput).toHaveValue("Test User");
    expect(emailInput).toHaveValue("test@example.com");

    // Type new values
    await user.clear(nameInput);
    await user.type(nameInput, "New Name");

    // Save
    const saveButton = screen.getByText("Save");
    await user.click(saveButton);

    expect(mockUpdateProfile).toHaveBeenCalledWith({
      name: "New Name",
      email: "test@example.com",
    });
  });
});
