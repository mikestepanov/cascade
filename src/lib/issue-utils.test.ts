import { describe, it, expect } from "vitest";
import {
  getTypeIcon,
  getPriorityColor,
  getPriorityIcon,
  getPriorityEmoji,
  getTypeLabel,
  getStatusColor,
} from "./issue-utils";

describe("issue-utils", () => {
  describe("getTypeIcon", () => {
    it("should return correct icon for bug type", () => {
      expect(getTypeIcon("bug")).toBe("🐛");
    });

    it("should return correct icon for story type", () => {
      expect(getTypeIcon("story")).toBe("📖");
    });

    it("should return correct icon for epic type", () => {
      expect(getTypeIcon("epic")).toBe("⚡");
    });

    it("should return default icon for task type", () => {
      expect(getTypeIcon("task")).toBe("✓");
    });

    it("should return default icon for unknown type", () => {
      expect(getTypeIcon("unknown")).toBe("✓");
      expect(getTypeIcon("")).toBe("✓");
    });
  });

  describe("getPriorityColor", () => {
    describe("text variant", () => {
      it("should return correct color for highest priority", () => {
        expect(getPriorityColor("highest", "text")).toBe("text-red-600");
      });

      it("should return correct color for high priority", () => {
        expect(getPriorityColor("high", "text")).toBe("text-orange-600");
      });

      it("should return correct color for medium priority", () => {
        expect(getPriorityColor("medium", "text")).toBe("text-yellow-600");
      });

      it("should return correct color for low priority", () => {
        expect(getPriorityColor("low", "text")).toBe("text-blue-600");
      });

      it("should return correct color for lowest priority", () => {
        expect(getPriorityColor("lowest", "text")).toBe("text-gray-600");
      });

      it("should default to lowest for unknown priority", () => {
        expect(getPriorityColor("unknown", "text")).toBe("text-gray-600");
      });

      it("should use text variant as default", () => {
        expect(getPriorityColor("high")).toBe("text-orange-600");
      });
    });

    describe("bg variant", () => {
      it("should return correct color for highest priority", () => {
        expect(getPriorityColor("highest", "bg")).toBe(
          "bg-red-100 text-red-800",
        );
      });

      it("should return correct color for high priority", () => {
        expect(getPriorityColor("high", "bg")).toBe(
          "bg-orange-100 text-orange-800",
        );
      });

      it("should return correct color for medium priority", () => {
        expect(getPriorityColor("medium", "bg")).toBe(
          "bg-yellow-100 text-yellow-800",
        );
      });

      it("should return correct color for low priority", () => {
        expect(getPriorityColor("low", "bg")).toBe("bg-blue-100 text-blue-800");
      });

      it("should return correct color for lowest priority", () => {
        expect(getPriorityColor("lowest", "bg")).toBe(
          "bg-gray-100 text-gray-800",
        );
      });

      it("should default to lowest for unknown priority", () => {
        expect(getPriorityColor("unknown", "bg")).toBe(
          "bg-gray-100 text-gray-800",
        );
      });
    });

    describe("badge variant", () => {
      it("should return correct color for highest priority", () => {
        expect(getPriorityColor("highest", "badge")).toBe(
          "text-red-600 bg-red-50",
        );
      });

      it("should return correct color for high priority", () => {
        expect(getPriorityColor("high", "badge")).toBe(
          "text-orange-600 bg-orange-50",
        );
      });

      it("should return correct color for medium priority", () => {
        expect(getPriorityColor("medium", "badge")).toBe(
          "text-yellow-600 bg-yellow-50",
        );
      });

      it("should return correct color for low priority", () => {
        expect(getPriorityColor("low", "badge")).toBe(
          "text-blue-600 bg-blue-50",
        );
      });

      it("should return correct color for lowest priority", () => {
        expect(getPriorityColor("lowest", "badge")).toBe(
          "text-gray-600 bg-gray-50",
        );
      });
    });
  });

  describe("getPriorityIcon", () => {
    it("should return correct icon for highest priority", () => {
      expect(getPriorityIcon("highest")).toBe("↑↑");
    });

    it("should return correct icon for high priority", () => {
      expect(getPriorityIcon("high")).toBe("↑");
    });

    it("should return correct icon for medium priority", () => {
      expect(getPriorityIcon("medium")).toBe("→");
    });

    it("should return correct icon for low priority", () => {
      expect(getPriorityIcon("low")).toBe("↓");
    });

    it("should return correct icon for lowest priority", () => {
      expect(getPriorityIcon("lowest")).toBe("↓↓");
    });

    it("should return default icon for unknown priority", () => {
      expect(getPriorityIcon("unknown")).toBe("→");
      expect(getPriorityIcon("")).toBe("→");
    });
  });

  describe("getPriorityEmoji", () => {
    it("should return correct emoji for highest priority", () => {
      expect(getPriorityEmoji("highest")).toBe("⬆️");
    });

    it("should return correct emoji for high priority", () => {
      expect(getPriorityEmoji("high")).toBe("↗️");
    });

    it("should return correct emoji for medium priority", () => {
      expect(getPriorityEmoji("medium")).toBe("➡️");
    });

    it("should return correct emoji for low priority", () => {
      expect(getPriorityEmoji("low")).toBe("↘️");
    });

    it("should return correct emoji for lowest priority", () => {
      expect(getPriorityEmoji("lowest")).toBe("⬇️");
    });

    it("should return default emoji for unknown priority", () => {
      expect(getPriorityEmoji("unknown")).toBe("➡️");
      expect(getPriorityEmoji("")).toBe("➡️");
    });
  });

  describe("getTypeLabel", () => {
    it("should return correct label for bug type", () => {
      expect(getTypeLabel("bug")).toBe("🐛 Bug");
    });

    it("should return correct label for story type", () => {
      expect(getTypeLabel("story")).toBe("📖 Story");
    });

    it("should return correct label for epic type", () => {
      expect(getTypeLabel("epic")).toBe("🎯 Epic");
    });

    it("should return correct label for task type", () => {
      expect(getTypeLabel("task")).toBe("📋 Task");
    });

    it("should return default label for unknown type", () => {
      expect(getTypeLabel("unknown")).toBe("📋 Task");
      expect(getTypeLabel("")).toBe("📋 Task");
    });
  });

  describe("getStatusColor", () => {
    it("should return green for active status", () => {
      expect(getStatusColor("active")).toBe("bg-green-100 text-green-800");
      expect(getStatusColor("Active")).toBe("bg-green-100 text-green-800");
      expect(getStatusColor("ACTIVE")).toBe("bg-green-100 text-green-800");
    });

    it("should return green for in progress status", () => {
      expect(getStatusColor("in progress")).toBe("bg-green-100 text-green-800");
      expect(getStatusColor("In Progress")).toBe("bg-green-100 text-green-800");
      expect(getStatusColor("IN PROGRESS")).toBe("bg-green-100 text-green-800");
    });

    it("should return gray for completed status", () => {
      expect(getStatusColor("completed")).toBe("bg-gray-100 text-gray-800");
      expect(getStatusColor("Completed")).toBe("bg-gray-100 text-gray-800");
      expect(getStatusColor("COMPLETED")).toBe("bg-gray-100 text-gray-800");
    });

    it("should return gray for done status", () => {
      expect(getStatusColor("done")).toBe("bg-gray-100 text-gray-800");
      expect(getStatusColor("Done")).toBe("bg-gray-100 text-gray-800");
      expect(getStatusColor("DONE")).toBe("bg-gray-100 text-gray-800");
    });

    it("should return blue for future status", () => {
      expect(getStatusColor("future")).toBe("bg-blue-100 text-blue-800");
      expect(getStatusColor("Future")).toBe("bg-blue-100 text-blue-800");
      expect(getStatusColor("FUTURE")).toBe("bg-blue-100 text-blue-800");
    });

    it("should return blue for todo status", () => {
      expect(getStatusColor("todo")).toBe("bg-blue-100 text-blue-800");
      expect(getStatusColor("Todo")).toBe("bg-blue-100 text-blue-800");
      expect(getStatusColor("TODO")).toBe("bg-blue-100 text-blue-800");
    });

    it("should return red for blocked status", () => {
      expect(getStatusColor("blocked")).toBe("bg-red-100 text-red-800");
      expect(getStatusColor("Blocked")).toBe("bg-red-100 text-red-800");
      expect(getStatusColor("BLOCKED")).toBe("bg-red-100 text-red-800");
    });

    it("should return default gray for unknown status", () => {
      expect(getStatusColor("unknown")).toBe("bg-gray-100 text-gray-800");
      expect(getStatusColor("")).toBe("bg-gray-100 text-gray-800");
      expect(getStatusColor("custom-status")).toBe("bg-gray-100 text-gray-800");
    });
  });
});
