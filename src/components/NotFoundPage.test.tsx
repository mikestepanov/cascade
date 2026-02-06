import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { NotFoundPage } from "./NotFoundPage";

// Mock Link since we're not providing Router context
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock routes config
vi.mock("@/config/routes", () => ({
  ROUTES: {
    home: {
      path: "/",
    },
  },
}));

describe("NotFoundPage", () => {
  it("renders 404 message", () => {
    render(<NotFoundPage />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return home/i })).toBeInTheDocument();
  });
});
