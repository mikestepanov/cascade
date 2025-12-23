import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@/test/custom-render";
import { useDeleteConfirmation } from "./useDeleteConfirmation";

// Mock the toast module
vi.mock("../lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

import { showError, showSuccess } from "../lib/toast";

// Create a mock ID type that matches Convex Id structure
type MockId = string & { __tableName: "testTable" };
const createMockId = (value: string): MockId => value as MockId;

describe("useDeleteConfirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should start with deleteId as null", () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      expect(result.current.deleteId).toBeNull();
    });

    it("should start with isDeleting as false", () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      expect(result.current.isDeleting).toBe(false);
    });
  });

  describe("confirmDelete", () => {
    it("should set deleteId when called", async () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      const mockId = createMockId("test-id-123");

      result.current.confirmDelete(mockId);

      await waitFor(() => {
        expect(result.current.deleteId).toBe(mockId);
      });
    });

    it("should update deleteId when called multiple times", async () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      const mockId1 = createMockId("test-id-1");
      const mockId2 = createMockId("test-id-2");

      result.current.confirmDelete(mockId1);
      await waitFor(() => {
        expect(result.current.deleteId).toBe(mockId1);
      });

      result.current.confirmDelete(mockId2);
      await waitFor(() => {
        expect(result.current.deleteId).toBe(mockId2);
      });
    });
  });

  describe("cancelDelete", () => {
    it("should set deleteId to null", async () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      const mockId = createMockId("test-id-123");

      result.current.confirmDelete(mockId);
      await waitFor(() => {
        expect(result.current.deleteId).toBe(mockId);
      });

      result.current.cancelDelete();
      await waitFor(() => {
        expect(result.current.deleteId).toBeNull();
      });
    });

    it("should work when deleteId is already null", async () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      result.current.cancelDelete();

      await waitFor(() => {
        expect(result.current.deleteId).toBeNull();
      });
    });
  });

  describe("executeDelete - Success", () => {
    it("should call deleteFn with the deleteId", async () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      const mockId = createMockId("test-id-123");
      const deleteFn = vi.fn().mockResolvedValue(undefined);

      result.current.confirmDelete(mockId);
      await waitFor(() => {
        expect(result.current.deleteId).toBe(mockId);
      });

      await result.current.executeDelete(deleteFn);

      await waitFor(() => {
        expect(deleteFn).toHaveBeenCalledWith(mockId);
      });
    });

    it("should show success toast on successful delete", async () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      const mockId = createMockId("test-id-123");
      const deleteFn = vi.fn().mockResolvedValue(undefined);

      result.current.confirmDelete(mockId);
      await waitFor(() => {
        expect(result.current.deleteId).toBe(mockId);
      });

      await result.current.executeDelete(deleteFn);

      await waitFor(() => {
        expect(showSuccess).toHaveBeenCalledWith("Deleted successfully");
      });
    });

    it("should show custom success message when provided", async () => {
      const { result } = renderHook(() =>
        useDeleteConfirmation<"testTable">({
          successMessage: "Item removed!",
        }),
      );

      const mockId = createMockId("test-id-123");
      const deleteFn = vi.fn().mockResolvedValue(undefined);

      result.current.confirmDelete(mockId);
      await waitFor(() => {
        expect(result.current.deleteId).toBe(mockId);
      });

      await result.current.executeDelete(deleteFn);

      await waitFor(() => {
        expect(showSuccess).toHaveBeenCalledWith("Item removed!");
      });
    });

    it("should call onSuccess callback on successful delete", async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useDeleteConfirmation<"testTable">({
          onSuccess,
        }),
      );

      const mockId = createMockId("test-id-123");
      const deleteFn = vi.fn().mockResolvedValue(undefined);

      result.current.confirmDelete(mockId);
      await waitFor(() => {
        expect(result.current.deleteId).toBe(mockId);
      });

      await result.current.executeDelete(deleteFn);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it("should reset deleteId to null after successful delete", async () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      const mockId = createMockId("test-id-123");
      const deleteFn = vi.fn().mockResolvedValue(undefined);

      result.current.confirmDelete(mockId);
      await waitFor(() => {
        expect(result.current.deleteId).toBe(mockId);
      });

      await result.current.executeDelete(deleteFn);

      await waitFor(() => {
        expect(result.current.deleteId).toBeNull();
      });
    });

    it("should set isDeleting to false after successful delete", async () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      const mockId = createMockId("test-id-123");
      const deleteFn = vi.fn().mockResolvedValue(undefined);

      result.current.confirmDelete(mockId);
      await waitFor(() => {
        expect(result.current.deleteId).toBe(mockId);
      });

      await result.current.executeDelete(deleteFn);

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
      });
    });
  });

  describe("executeDelete - Error", () => {
    it("should show error toast on failed delete", async () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      const mockId = createMockId("test-id-123");
      const error = new Error("Delete failed");
      const deleteFn = vi.fn().mockRejectedValue(error);

      result.current.confirmDelete(mockId);
      await waitFor(() => {
        expect(result.current.deleteId).toBe(mockId);
      });

      await result.current.executeDelete(deleteFn);

      await waitFor(() => {
        expect(showError).toHaveBeenCalledWith(error, "Failed to delete");
      });
    });

    it("should show custom error message when provided", async () => {
      const { result } = renderHook(() =>
        useDeleteConfirmation<"testTable">({
          errorMessage: "Could not remove item",
        }),
      );

      const mockId = createMockId("test-id-123");
      const error = new Error("Delete failed");
      const deleteFn = vi.fn().mockRejectedValue(error);

      result.current.confirmDelete(mockId);
      await waitFor(() => {
        expect(result.current.deleteId).toBe(mockId);
      });

      await result.current.executeDelete(deleteFn);

      await waitFor(() => {
        expect(showError).toHaveBeenCalledWith(error, "Could not remove item");
      });
    });

    it("should call onError callback on failed delete", async () => {
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useDeleteConfirmation<"testTable">({
          onError,
        }),
      );

      const mockId = createMockId("test-id-123");
      const error = new Error("Delete failed");
      const deleteFn = vi.fn().mockRejectedValue(error);

      result.current.confirmDelete(mockId);
      await waitFor(() => {
        expect(result.current.deleteId).toBe(mockId);
      });

      await result.current.executeDelete(deleteFn);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });

    it("should NOT reset deleteId on failed delete", async () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      const mockId = createMockId("test-id-123");
      const deleteFn = vi.fn().mockRejectedValue(new Error("Delete failed"));

      result.current.confirmDelete(mockId);
      await waitFor(() => {
        expect(result.current.deleteId).toBe(mockId);
      });

      await result.current.executeDelete(deleteFn);

      await waitFor(() => {
        // deleteId should remain so user can retry
        expect(result.current.deleteId).toBe(mockId);
      });
    });

    it("should set isDeleting to false after failed delete", async () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      const mockId = createMockId("test-id-123");
      const deleteFn = vi.fn().mockRejectedValue(new Error("Delete failed"));

      result.current.confirmDelete(mockId);
      await waitFor(() => {
        expect(result.current.deleteId).toBe(mockId);
      });

      await result.current.executeDelete(deleteFn);

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
      });
    });
  });

  describe("executeDelete - No deleteId", () => {
    it("should not call deleteFn when deleteId is null", async () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      const deleteFn = vi.fn().mockResolvedValue(undefined);

      await result.current.executeDelete(deleteFn);

      await waitFor(() => {
        expect(deleteFn).not.toHaveBeenCalled();
      });
    });

    it("should not show any toast when deleteId is null", async () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      const deleteFn = vi.fn().mockResolvedValue(undefined);

      await result.current.executeDelete(deleteFn);

      await waitFor(() => {
        expect(showSuccess).not.toHaveBeenCalled();
        expect(showError).not.toHaveBeenCalled();
      });
    });
  });

  describe("isDeleting State", () => {
    it("should set isDeleting to false after delete completes", async () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      const mockId = createMockId("test-id-123");
      const deleteFn = vi.fn().mockResolvedValue(undefined);

      result.current.confirmDelete(mockId);
      await waitFor(() => {
        expect(result.current.deleteId).toBe(mockId);
      });

      // Before delete
      expect(result.current.isDeleting).toBe(false);

      await result.current.executeDelete(deleteFn);

      // After delete completes
      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
      });
    });
  });

  describe("Return Value Shape", () => {
    it("should return object with expected properties", () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      expect(result.current).toHaveProperty("deleteId");
      expect(result.current).toHaveProperty("isDeleting");
      expect(result.current).toHaveProperty("confirmDelete");
      expect(result.current).toHaveProperty("cancelDelete");
      expect(result.current).toHaveProperty("executeDelete");
    });

    it("should return functions for confirmDelete, cancelDelete, executeDelete", () => {
      const { result } = renderHook(() => useDeleteConfirmation<"testTable">());

      expect(typeof result.current.confirmDelete).toBe("function");
      expect(typeof result.current.cancelDelete).toBe("function");
      expect(typeof result.current.executeDelete).toBe("function");
    });
  });
});
