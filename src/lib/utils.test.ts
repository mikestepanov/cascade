import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn utility function", () => {
  it("should merge class names", () => {
    const result = cn("px-4", "py-2");
    expect(result).toBe("px-4 py-2");
  });

  it("should handle conditional classes", () => {
    const result = cn("px-4", false, "py-2");
    expect(result).toBe("px-4 py-2");
  });

  it("should handle Tailwind conflicts correctly", () => {
    // twMerge should resolve conflicting classes
    const result = cn("px-2 px-4");
    expect(result).toBe("px-4");
  });

  it("should handle empty inputs", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle arrays of classes", () => {
    const result = cn(["px-4", "py-2"]);
    expect(result).toBe("px-4 py-2");
  });

  it("should handle objects with boolean values", () => {
    const result = cn({
      "px-4": true,
      "py-2": false,
      "text-red-500": true,
    });
    expect(result).toBe("px-4 text-red-500");
  });
});
