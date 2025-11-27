import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useModal } from "./useModal";

describe("useModal", () => {
  describe("Initial State", () => {
    it("should start with isOpen as false by default", () => {
      const { result } = renderHook(() => useModal());

      expect(result.current.isOpen).toBe(false);
    });

    it("should start with isOpen as true when initialState is true", () => {
      const { result } = renderHook(() => useModal(true));

      expect(result.current.isOpen).toBe(true);
    });

    it("should start with isOpen as false when initialState is false", () => {
      const { result } = renderHook(() => useModal(false));

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("open", () => {
    it("should set isOpen to true when called", () => {
      const { result } = renderHook(() => useModal());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("should keep isOpen as true when already open", () => {
      const { result } = renderHook(() => useModal(true));

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("should be a stable function reference", () => {
      const { result, rerender } = renderHook(() => useModal());

      const openRef = result.current.open;
      rerender();

      expect(result.current.open).toBe(openRef);
    });
  });

  describe("close", () => {
    it("should set isOpen to false when called", () => {
      const { result } = renderHook(() => useModal(true));

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("should keep isOpen as false when already closed", () => {
      const { result } = renderHook(() => useModal());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("should be a stable function reference", () => {
      const { result, rerender } = renderHook(() => useModal());

      const closeRef = result.current.close;
      rerender();

      expect(result.current.close).toBe(closeRef);
    });
  });

  describe("toggle", () => {
    it("should toggle isOpen from false to true", () => {
      const { result } = renderHook(() => useModal());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("should toggle isOpen from true to false", () => {
      const { result } = renderHook(() => useModal(true));

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("should toggle multiple times correctly", () => {
      const { result } = renderHook(() => useModal());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(true);
    });

    it("should be a stable function reference", () => {
      const { result, rerender } = renderHook(() => useModal());

      const toggleRef = result.current.toggle;
      rerender();

      expect(result.current.toggle).toBe(toggleRef);
    });
  });

  describe("Combined Operations", () => {
    it("should work correctly with open, close, toggle sequence", () => {
      const { result } = renderHook(() => useModal());

      // Start closed
      expect(result.current.isOpen).toBe(false);

      // Open
      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      // Close
      act(() => {
        result.current.close();
      });
      expect(result.current.isOpen).toBe(false);

      // Toggle to open
      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(true);

      // Close again
      act(() => {
        result.current.close();
      });
      expect(result.current.isOpen).toBe(false);
    });

    it("should handle rapid state changes", () => {
      const { result } = renderHook(() => useModal());

      act(() => {
        result.current.open();
        result.current.close();
        result.current.toggle();
        result.current.toggle();
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe("Return Value Shape", () => {
    it("should return object with expected properties", () => {
      const { result } = renderHook(() => useModal());

      expect(result.current).toHaveProperty("isOpen");
      expect(result.current).toHaveProperty("open");
      expect(result.current).toHaveProperty("close");
      expect(result.current).toHaveProperty("toggle");
    });

    it("should return functions for open, close, and toggle", () => {
      const { result } = renderHook(() => useModal());

      expect(typeof result.current.open).toBe("function");
      expect(typeof result.current.close).toBe("function");
      expect(typeof result.current.toggle).toBe("function");
    });

    it("should return boolean for isOpen", () => {
      const { result } = renderHook(() => useModal());

      expect(typeof result.current.isOpen).toBe("boolean");
    });
  });
});
