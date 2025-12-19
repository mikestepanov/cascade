import { renderHook, waitFor } from "@/test/custom-render";
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
    it("should set isOpen to true when called", async () => {
      const { result } = renderHook(() => useModal());

      expect(result.current.isOpen).toBe(false);

      result.current.open();

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });
    });

    it("should keep isOpen as true when already open", async () => {
      const { result } = renderHook(() => useModal(true));

      expect(result.current.isOpen).toBe(true);

      result.current.open();

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });
    });
  });

  describe("close", () => {
    it("should set isOpen to false when called", async () => {
      const { result } = renderHook(() => useModal(true));

      expect(result.current.isOpen).toBe(true);

      result.current.close();

      await waitFor(() => {
        expect(result.current.isOpen).toBe(false);
      });
    });

    it("should keep isOpen as false when already closed", async () => {
      const { result } = renderHook(() => useModal(false));

      expect(result.current.isOpen).toBe(false);

      result.current.close();

      await waitFor(() => {
        expect(result.current.isOpen).toBe(false);
      });
    });
  });

  describe("toggle", () => {
    it("should toggle isOpen from false to true", async () => {
      const { result } = renderHook(() => useModal());

      expect(result.current.isOpen).toBe(false);

      result.current.toggle();

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });
    });

    it("should toggle isOpen from true to false", async () => {
      const { result } = renderHook(() => useModal(true));

      expect(result.current.isOpen).toBe(true);

      result.current.toggle();

      await waitFor(() => {
        expect(result.current.isOpen).toBe(false);
      });
    });

    it("should toggle multiple times correctly", async () => {
      const { result } = renderHook(() => useModal());

      expect(result.current.isOpen).toBe(false);

      result.current.toggle();
      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });

      result.current.toggle();
      await waitFor(() => {
        expect(result.current.isOpen).toBe(false);
      });

      result.current.toggle();
      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });
    });
  });

  describe("Combined Operations", () => {
    it("should work correctly with open, close, toggle sequence", async () => {
      const { result } = renderHook(() => useModal());

      expect(result.current.isOpen).toBe(false);

      result.current.open();
      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });

      result.current.toggle();
      await waitFor(() => {
        expect(result.current.isOpen).toBe(false);
      });

      result.current.toggle();
      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });

      result.current.close();
      await waitFor(() => {
        expect(result.current.isOpen).toBe(false);
      });
    });

    it("should handle rapid state changes", async () => {
      const { result } = renderHook(() => useModal());

      result.current.open();
      result.current.close();
      result.current.open();

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });
    });
  });
});
