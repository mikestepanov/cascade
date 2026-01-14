import { describe, expect, it } from "vitest";
import {
  getPriorityColor,
  getPriorityEmoji,
  getPriorityIcon,
  getStatusColor,
  getTypeIcon,
  getTypeLabel,
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
        expect(getPriorityColor("highest", "text")).toBe("text-priority-highest");
      });

      it("should return correct color for high priority", () => {
        expect(getPriorityColor("high", "text")).toBe("text-priority-high");
      });

      it("should return correct color for medium priority", () => {
        expect(getPriorityColor("medium", "text")).toBe("text-priority-medium");
      });

      it("should return correct color for low priority", () => {
        expect(getPriorityColor("low", "text")).toBe("text-priority-low");
      });

      it("should return correct color for lowest priority", () => {
        expect(getPriorityColor("lowest", "text")).toBe("text-priority-lowest");
      });

      it("should default to lowest for unknown priority", () => {
        expect(getPriorityColor("unknown", "text")).toBe("text-priority-lowest");
      });

      it("should use text variant as default", () => {
        expect(getPriorityColor("high")).toBe("text-priority-high");
      });
    });

    describe("bg variant", () => {
      it("should return correct color for highest priority", () => {
        expect(getPriorityColor("highest", "bg")).toBe("bg-status-error-bg text-status-error-text");
      });

      it("should return correct color for high priority", () => {
        expect(getPriorityColor("high", "bg")).toBe(
          "bg-status-warning-bg text-status-warning-text",
        );
      });

      it("should return correct color for medium priority", () => {
        expect(getPriorityColor("medium", "bg")).toBe(
          "bg-status-warning-bg text-status-warning-text",
        );
      });

      it("should return correct color for low priority", () => {
        expect(getPriorityColor("low", "bg")).toBe("bg-status-info-bg text-status-info-text");
      });

      it("should return correct color for lowest priority", () => {
        expect(getPriorityColor("lowest", "bg")).toBe("bg-ui-bg-tertiary text-ui-text-secondary");
      });

      it("should default to lowest for unknown priority", () => {
        expect(getPriorityColor("unknown", "bg")).toBe("bg-ui-bg-tertiary text-ui-text-secondary");
      });
    });

    describe("badge variant", () => {
      it("should return correct color for highest priority", () => {
        expect(getPriorityColor("highest", "badge")).toBe(
          "text-priority-highest bg-status-error-bg",
        );
      });

      it("should return correct color for high priority", () => {
        expect(getPriorityColor("high", "badge")).toBe("text-priority-high bg-status-warning-bg");
      });

      it("should return correct color for medium priority", () => {
        expect(getPriorityColor("medium", "badge")).toBe(
          "text-priority-medium bg-status-warning-bg",
        );
      });

      it("should return correct color for low priority", () => {
        expect(getPriorityColor("low", "badge")).toBe("text-priority-low bg-status-info-bg");
      });

      it("should return correct color for lowest priority", () => {
        expect(getPriorityColor("lowest", "badge")).toBe("text-priority-lowest bg-ui-bg-tertiary");
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
    it("should return success colors for active status", () => {
      const expected = "bg-status-success-bg text-status-success-text";
      expect(getStatusColor("active")).toBe(expected);
      expect(getStatusColor("Active")).toBe(expected);
      expect(getStatusColor("ACTIVE")).toBe(expected);
    });

    it("should return success colors for in progress status", () => {
      const expected = "bg-status-success-bg text-status-success-text";
      expect(getStatusColor("in progress")).toBe(expected);
      expect(getStatusColor("In Progress")).toBe(expected);
      expect(getStatusColor("IN PROGRESS")).toBe(expected);
    });

    it("should return tertiary colors for completed status", () => {
      const expected =
        "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-secondary dark:text-ui-text-secondary-dark";
      expect(getStatusColor("completed")).toBe(expected);
      expect(getStatusColor("Completed")).toBe(expected);
      expect(getStatusColor("COMPLETED")).toBe(expected);
    });

    it("should return tertiary colors for done status", () => {
      const expected =
        "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-secondary dark:text-ui-text-secondary-dark";
      expect(getStatusColor("done")).toBe(expected);
      expect(getStatusColor("Done")).toBe(expected);
      expect(getStatusColor("DONE")).toBe(expected);
    });

    it("should return info colors for future status", () => {
      const expected =
        "bg-status-info-bg dark:bg-status-info-bg-dark text-status-info-text dark:text-status-info-text-dark";
      expect(getStatusColor("future")).toBe(expected);
      expect(getStatusColor("Future")).toBe(expected);
      expect(getStatusColor("FUTURE")).toBe(expected);
    });

    it("should return info colors for todo status", () => {
      const expected = "bg-status-info-bg text-status-info-text";
      expect(getStatusColor("todo")).toBe(expected);
      expect(getStatusColor("Todo")).toBe(expected);
      expect(getStatusColor("TODO")).toBe(expected);
    });

    it("should return error colors for blocked status", () => {
      const expected = "bg-status-error-bg text-status-error-text";
      expect(getStatusColor("blocked")).toBe(expected);
      expect(getStatusColor("Blocked")).toBe(expected);
      expect(getStatusColor("BLOCKED")).toBe(expected);
    });

    it("should return default tertiary for unknown status", () => {
      const expected = "bg-ui-bg-tertiary text-ui-text-secondary";
      expect(getStatusColor("unknown")).toBe(expected);
      expect(getStatusColor("")).toBe(expected);
      expect(getStatusColor("custom-status")).toBe(expected);
    });
  });
});
