/**
 * Unit tests for ConvexYjsProvider utilities
 */

import { describe, expect, it } from "vitest";
import { ConvexYjsProvider } from "./ConvexYjsProvider";

describe("ConvexYjsProvider", () => {
  describe("getUserColor", () => {
    it("returns a consistent color for the same user ID", () => {
      const color1 = ConvexYjsProvider.getUserColor("user-123");
      const color2 = ConvexYjsProvider.getUserColor("user-123");
      expect(color1).toBe(color2);
    });

    it("returns different colors for different user IDs", () => {
      const color1 = ConvexYjsProvider.getUserColor("user-123");
      const color2 = ConvexYjsProvider.getUserColor("user-456");
      // Note: could theoretically be the same due to hash collision, but unlikely
      expect(color1).not.toBe(color2);
    });

    it("returns a valid hex color", () => {
      const color = ConvexYjsProvider.getUserColor("test-user");
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("handles empty string", () => {
      const color = ConvexYjsProvider.getUserColor("");
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("handles special characters", () => {
      const color = ConvexYjsProvider.getUserColor("user@example.com");
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });
});
