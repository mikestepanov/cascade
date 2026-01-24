import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  conflict,
  forbidden,
  getErrorCode,
  getErrorMessage,
  internal,
  isAppError,
  notFound,
  rateLimited,
  requireExists,
  requireOwned,
  unauthenticated,
  validation,
} from "./errors";

describe("error utilities", () => {
  describe("unauthenticated", () => {
    it("should create UNAUTHENTICATED error", () => {
      const error = unauthenticated();
      expect(error).toBeInstanceOf(ConvexError);
      expect(error.data.code).toBe("UNAUTHENTICATED");
      expect(error.data.message).toBe("Not authenticated");
    });
  });

  describe("forbidden", () => {
    it("should create FORBIDDEN error without role", () => {
      const error = forbidden();
      expect(error.data.code).toBe("FORBIDDEN");
      expect(error.data.message).toBe("Not authorized");
      expect(error.data.requiredRole).toBeUndefined();
    });

    it("should create FORBIDDEN error with required role", () => {
      const error = forbidden("editor");
      expect(error.data.code).toBe("FORBIDDEN");
      expect(error.data.requiredRole).toBe("editor");
    });

    it("should use custom message", () => {
      const error = forbidden("admin", "Only admins can delete");
      expect(error.data.message).toBe("Only admins can delete");
    });
  });

  describe("notFound", () => {
    it("should create NOT_FOUND error", () => {
      const error = notFound("project");
      expect(error.data.code).toBe("NOT_FOUND");
      expect(error.data.resource).toBe("project");
      expect(error.data.message).toBe("Project not found");
    });

    it("should include resource ID", () => {
      const error = notFound("issue", "ISSUE-123");
      expect(error.data.id).toBe("ISSUE-123");
    });

    it("should capitalize resource name in message", () => {
      const error = notFound("calendarEvent");
      expect(error.data.message).toBe("CalendarEvent not found");
    });
  });

  describe("validation", () => {
    it("should create VALIDATION error", () => {
      const error = validation("title", "Title must be at least 1 character");
      expect(error.data.code).toBe("VALIDATION");
      expect(error.data.field).toBe("title");
      expect(error.data.message).toBe("Title must be at least 1 character");
    });
  });

  describe("conflict", () => {
    it("should create CONFLICT error", () => {
      const error = conflict("A project with this key already exists");
      expect(error.data.code).toBe("CONFLICT");
      expect(error.data.message).toBe("A project with this key already exists");
    });
  });

  describe("rateLimited", () => {
    it("should create RATE_LIMITED error without retry time", () => {
      const error = rateLimited();
      expect(error.data.code).toBe("RATE_LIMITED");
      expect(error.data.message).toBe("Rate limit exceeded.");
      expect(error.data.retryAfter).toBeUndefined();
    });

    it("should create RATE_LIMITED error with retry time", () => {
      const error = rateLimited(30);
      expect(error.data.retryAfter).toBe(30);
      expect(error.data.message).toBe("Rate limit exceeded. Retry after 30 seconds.");
    });
  });

  describe("internal", () => {
    it("should create INTERNAL error", () => {
      const error = internal("Database connection failed");
      expect(error.data.code).toBe("INTERNAL");
      expect(error.data.message).toBe("Database connection failed");
    });
  });

  describe("requireExists", () => {
    it("should return resource when it exists", () => {
      const project = { id: "123", name: "Test" };
      const result = requireExists(project, "project");
      expect(result).toBe(project);
    });

    it("should throw notFound when resource is null", () => {
      expect(() => requireExists(null, "project", "123")).toThrow();
      try {
        requireExists(null, "project", "123");
      } catch (e) {
        expect((e as ConvexError<{ code: string }>).data.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("requireOwned", () => {
    it("should return resource when owned by user", () => {
      const key = { id: "key-123", userId: "user-456" };
      const result = requireOwned(key, "user-456", "apiKey");
      expect(result).toBe(key);
    });

    it("should throw notFound when resource is null", () => {
      expect(() => requireOwned(null, "user-456", "apiKey")).toThrow();
      try {
        requireOwned(null, "user-456", "apiKey");
      } catch (e) {
        expect((e as ConvexError<{ code: string }>).data.code).toBe("NOT_FOUND");
      }
    });

    it("should throw forbidden when not owned", () => {
      const key = { id: "key-123", userId: "other-user" };
      expect(() => requireOwned(key, "user-456", "apiKey")).toThrow();
      try {
        requireOwned(key, "user-456", "apiKey");
      } catch (e) {
        expect((e as ConvexError<{ code: string }>).data.code).toBe("FORBIDDEN");
      }
    });

    it("should use custom owner field", () => {
      const booking = { id: "booking-123", hostId: "user-456" };
      const result = requireOwned(booking, "user-456", "booking", "hostId");
      expect(result).toBe(booking);
    });
  });

  describe("isAppError", () => {
    it("should return true for app errors", () => {
      expect(isAppError(unauthenticated())).toBe(true);
      expect(isAppError(forbidden())).toBe(true);
      expect(isAppError(notFound("test"))).toBe(true);
      expect(isAppError(validation("field", "msg"))).toBe(true);
    });

    it("should return false for regular errors", () => {
      expect(isAppError(new Error("Regular error"))).toBe(false);
    });

    it("should return false for non-error values", () => {
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError("string")).toBe(false);
      expect(isAppError({})).toBe(false);
    });

    it("should return false for ConvexError without code", () => {
      const error = new ConvexError({ message: "No code" });
      expect(isAppError(error)).toBe(false);
    });
  });

  describe("getErrorCode", () => {
    it("should return error code for app errors", () => {
      expect(getErrorCode(unauthenticated())).toBe("UNAUTHENTICATED");
      expect(getErrorCode(forbidden())).toBe("FORBIDDEN");
      expect(getErrorCode(notFound("test"))).toBe("NOT_FOUND");
      expect(getErrorCode(validation("f", "m"))).toBe("VALIDATION");
      expect(getErrorCode(conflict("msg"))).toBe("CONFLICT");
      expect(getErrorCode(rateLimited())).toBe("RATE_LIMITED");
      expect(getErrorCode(internal("msg"))).toBe("INTERNAL");
    });

    it("should return undefined for non-app errors", () => {
      expect(getErrorCode(new Error("Regular"))).toBeUndefined();
      expect(getErrorCode(null)).toBeUndefined();
    });
  });

  describe("getErrorMessage", () => {
    it("should return message from app errors", () => {
      expect(getErrorMessage(unauthenticated())).toBe("Not authenticated");
      expect(getErrorMessage(notFound("project"))).toBe("Project not found");
      expect(getErrorMessage(validation("title", "Too long"))).toBe("Too long");
    });

    it("should return default message when no message in app error", () => {
      // Create error with code but without message
      const error = new ConvexError({ code: "FORBIDDEN" } as {
        code: "FORBIDDEN";
        message?: string;
      });
      expect(getErrorMessage(error)).toBe("You don't have permission to do this");
    });

    it("should return message from regular Error", () => {
      expect(getErrorMessage(new Error("Something broke"))).toBe("Something broke");
    });

    it("should return generic message for unknown errors", () => {
      expect(getErrorMessage(null)).toBe("An unexpected error occurred");
      expect(getErrorMessage("string error")).toBe("An unexpected error occurred");
      expect(getErrorMessage({})).toBe("An unexpected error occurred");
    });
  });
});
