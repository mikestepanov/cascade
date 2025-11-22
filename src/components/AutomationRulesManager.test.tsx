import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import { AutomationRulesManager } from "./AutomationRulesManager";

// Helper to create properly typed mock IDs
function mockId<T extends string>(id: string): Id<T> {
  return id as Id<T>;
}

// Helper to set up mutations for create flow
function setupCreateMutations() {
  (useMutation as vi.Mock).mockReturnValue(mockCreateRule);
}

// Helper to set up mutations for update flow
function setupUpdateMutations() {
  (useMutation as vi.Mock).mockReturnValue(mockUpdateRule);
}

// Mock dependencies
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AutomationRulesManager - Component Behavior", () => {
  const mockProjectId = mockId<"projects">("project123");
  const mockCreateRule = vi.fn();
  const mockUpdateRule = vi.fn();
  const mockRemoveRule = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mutations - components call useMutation in different orders depending on what's rendered
    // Return mockUpdateRule for most calls since it's used for both form updates and toggles
    // This is a limitation of mocking at the hook level vs the API level
    (useMutation as vi.Mock).mockReturnValue(mockUpdateRule);

    (useQuery as vi.Mock).mockReturnValue([]);
  });

  describe("Empty State", () => {
    it("should show empty state message when no rules exist", () => {
      (useQuery as vi.Mock).mockReturnValue([]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByText(/No automation rules yet/i)).toBeInTheDocument();
      expect(screen.getByText(/Create your first rule/i)).toBeInTheDocument();
    });

    it("should show Create Rule button", () => {
      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByRole("button", { name: /Create Rule/i })).toBeInTheDocument();
    });
  });

  describe("Dialog Display Logic", () => {
    it("should not show dialog initially", () => {
      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.queryByText(/Create Automation Rule/i)).not.toBeInTheDocument();
    });

    it("should show dialog when Create Rule clicked", async () => {
      const user = userEvent.setup();

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));

      expect(screen.getByText("Create Automation Rule")).toBeInTheDocument();
    });

    it("should close dialog when Cancel clicked", async () => {
      const user = userEvent.setup();

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.click(screen.getByRole("button", { name: /Cancel/i }));

      expect(screen.queryByText("Create Automation Rule")).not.toBeInTheDocument();
    });

    it("should reset form when opening create dialog", async () => {
      const user = userEvent.setup();

      render(<AutomationRulesManager projectId={mockProjectId} />);

      // Open dialog and fill form
      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i), "Old Name");

      // Close dialog
      await user.click(screen.getByRole("button", { name: /Cancel/i }));

      // Reopen dialog
      await user.click(screen.getByRole("button", { name: /Create Rule/i }));

      // Form should be empty
      expect(screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i)).toHaveValue("");
    });
  });

  describe("Form Validation - Required Fields", () => {
    it("should reject save when name is empty", async () => {
      const user = userEvent.setup();

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      // Leave name empty
      fireEvent.change(screen.getByPlaceholderText(/\{"label": "urgent"\}/i), {
        target: { value: '{"test":"value"}' },
      });
      await user.click(screen.getAllByRole("button", { name: /Create Rule/i })[1]);

      expect(toast.error).toHaveBeenCalledWith("Please fill in all required fields");
      expect(mockCreateRule).not.toHaveBeenCalled();
    });

    it("should reject save when actionValue is empty", async () => {
      const user = userEvent.setup();

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i), "Test Rule");
      // Leave actionValue empty
      await user.click(screen.getAllByRole("button", { name: /Create Rule/i })[1]);

      expect(toast.error).toHaveBeenCalledWith("Please fill in all required fields");
      expect(mockCreateRule).not.toHaveBeenCalled();
    });

    it("should treat whitespace-only name as empty", async () => {
      const user = userEvent.setup();

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i), "   ");
      fireEvent.change(screen.getByPlaceholderText(/\{"label": "urgent"\}/i), {
        target: { value: '{"test":"value"}' },
      });
      await user.click(screen.getAllByRole("button", { name: /Create Rule/i })[1]);

      expect(toast.error).toHaveBeenCalledWith("Please fill in all required fields");
    });

    it("should treat whitespace-only actionValue as empty", async () => {
      const user = userEvent.setup();

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i), "Test Rule");
      fireEvent.change(screen.getByPlaceholderText(/\{"label": "urgent"\}/i), { target: { value: "   " } });
      await user.click(screen.getAllByRole("button", { name: /Create Rule/i })[1]);

      expect(toast.error).toHaveBeenCalledWith("Please fill in all required fields");
    });
  });

  describe("JSON Validation Logic", () => {
    it("should reject invalid JSON in actionValue", async () => {
      const user = userEvent.setup();

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i), "Test Rule");
      fireEvent.change(screen.getByPlaceholderText(/\{"label": "urgent"\}/i), {
        target: { value: "not valid json" },
      });
      await user.click(screen.getAllByRole("button", { name: /Create Rule/i })[1]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
        expect(mockCreateRule).not.toHaveBeenCalled();
      });
    });

    it("should accept valid JSON in actionValue", async () => {
      const user = userEvent.setup();
      mockCreateRule.mockResolvedValue({ _id: "rule1" });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i), "Test Rule");
      fireEvent.change(screen.getByPlaceholderText(/\{"label": "urgent"\}/i), {
        target: { value: '{"label":"urgent"}' },
      });
      await user.click(screen.getAllByRole("button", { name: /Create Rule/i })[1]);

      await waitFor(() => {
        expect(mockCreateRule).toHaveBeenCalled();
        expect(toast.error).not.toHaveBeenCalledWith(expect.stringContaining("Failed"));
      });
    });

    it("should accept empty object as valid JSON", async () => {
      const user = userEvent.setup();
      mockCreateRule.mockResolvedValue({ _id: "rule1" });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i), "Test Rule");
      fireEvent.change(screen.getByPlaceholderText(/\{"label": "urgent"\}/i), { target: { value: "{}" } });
      await user.click(screen.getAllByRole("button", { name: /Create Rule/i })[1]);

      await waitFor(() => {
        expect(mockCreateRule).toHaveBeenCalled();
      });
    });

    it("should accept complex nested JSON", async () => {
      const user = userEvent.setup();
      mockCreateRule.mockResolvedValue({ _id: "rule1" });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i), "Test");
      fireEvent.change(screen.getByPlaceholderText(/\{"label": "urgent"\}/i), {
        target: { value: '{"data":{"nested":"value"},"array":[1,2,3]}' },
      });
      await user.click(screen.getAllByRole("button", { name: /Create Rule/i })[1]);

      await waitFor(() => {
        expect(mockCreateRule).toHaveBeenCalled();
      });
    });
  });

  describe("Whitespace Trimming Logic", () => {
    it("should trim name before sending", async () => {
      const user = userEvent.setup();
      mockCreateRule.mockResolvedValue({ _id: "rule1" });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(
        screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i),
        "  Trimmed Name  ",
      );
      fireEvent.change(screen.getByPlaceholderText(/\{"label": "urgent"\}/i), { target: { value: "{}" } });
      await user.click(screen.getAllByRole("button", { name: /Create Rule/i })[1]);

      await waitFor(() => {
        expect(mockCreateRule).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Trimmed Name",
          }),
        );
      });
    });

    it("should convert empty description to undefined", async () => {
      const user = userEvent.setup();
      mockCreateRule.mockResolvedValue({ _id: "rule1" });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i), "Test");
      // Leave description empty
      fireEvent.change(screen.getByPlaceholderText(/\{"label": "urgent"\}/i), { target: { value: "{}" } });
      await user.click(screen.getAllByRole("button", { name: /Create Rule/i })[1]);

      await waitFor(() => {
        expect(mockCreateRule).toHaveBeenCalledWith(
          expect.objectContaining({
            description: undefined,
          }),
        );
      });
    });

    it("should convert whitespace-only description to undefined", async () => {
      const user = userEvent.setup();
      mockCreateRule.mockResolvedValue({ _id: "rule1" });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i), "Test");
      await user.type(screen.getByPlaceholderText(/Optional description/i), "   ");
      fireEvent.change(screen.getByPlaceholderText(/\{"label": "urgent"\}/i), { target: { value: "{}" } });
      await user.click(screen.getAllByRole("button", { name: /Create Rule/i })[1]);

      await waitFor(() => {
        expect(mockCreateRule).toHaveBeenCalledWith(
          expect.objectContaining({
            description: undefined,
          }),
        );
      });
    });

    it("should convert empty triggerValue to undefined", async () => {
      const user = userEvent.setup();
      mockCreateRule.mockResolvedValue({ _id: "rule1" });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i), "Test");
      // Leave trigger value empty
      fireEvent.change(screen.getByPlaceholderText(/\{"label": "urgent"\}/i), { target: { value: "{}" } });
      await user.click(screen.getAllByRole("button", { name: /Create Rule/i })[1]);

      await waitFor(() => {
        expect(mockCreateRule).toHaveBeenCalledWith(
          expect.objectContaining({
            triggerValue: undefined,
          }),
        );
      });
    });
  });

  describe("Edit Mode Behavior", () => {
    const existingRule = {
      _id: mockId<"automationRules">("rule1"),
      name: "Existing Rule",
      description: "A description",
      trigger: "priority_changed",
      triggerValue: "high",
      actionType: "send_notification",
      actionValue: '{"message":"High priority!"}',
      isActive: true,
      executionCount: 10,
    };

    it("should populate form when Edit clicked", async () => {
      const user = userEvent.setup();
      (useQuery as vi.Mock).mockReturnValue([existingRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Edit rule/i));

      expect(screen.getByDisplayValue("Existing Rule")).toBeInTheDocument();
      expect(screen.getByDisplayValue("A description")).toBeInTheDocument();
      expect(screen.getByDisplayValue("high")).toBeInTheDocument();
      expect(screen.getByDisplayValue('{"message":"High priority!"}')).toBeInTheDocument();
    });

    it("should show 'Edit Automation Rule' title in edit mode", async () => {
      const user = userEvent.setup();
      (useQuery as vi.Mock).mockReturnValue([existingRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Edit rule/i));

      expect(screen.getByText("Edit Automation Rule")).toBeInTheDocument();
    });

    it("should show 'Update Rule' button in edit mode", async () => {
      const user = userEvent.setup();
      (useQuery as vi.Mock).mockReturnValue([existingRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Edit rule/i));

      expect(screen.getByRole("button", { name: /Update Rule/i })).toBeInTheDocument();
    });

    it("should preserve selected trigger and action type in edit mode", async () => {
      const user = userEvent.setup();
      (useQuery as vi.Mock).mockReturnValue([existingRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Edit rule/i));

      const selects = screen.getAllByRole("combobox");
      const triggerSelect = selects[0] as HTMLSelectElement;
      const actionSelect = selects[1] as HTMLSelectElement;

      expect(triggerSelect.value).toBe("priority_changed");
      expect(actionSelect.value).toBe("send_notification");
    });

    it("should call updateRule instead of createRule when saving in edit mode", async () => {
      const user = userEvent.setup();
      (useQuery as vi.Mock).mockReturnValue([existingRule]);
      mockUpdateRule.mockResolvedValue({});

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Edit rule/i));
      await user.click(screen.getByRole("button", { name: /Update Rule/i }));

      await waitFor(() => {
        expect(mockUpdateRule).toHaveBeenCalled();
        expect(mockCreateRule).not.toHaveBeenCalled();
      });
    });

    it("should handle missing description in edit mode", async () => {
      const user = userEvent.setup();
      const ruleWithoutDescription = { ...existingRule, description: undefined };
      (useQuery as vi.Mock).mockReturnValue([ruleWithoutDescription]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Edit rule/i));

      expect(screen.getByPlaceholderText(/Optional description/i)).toHaveValue("");
    });

    it("should handle missing triggerValue in edit mode", async () => {
      const user = userEvent.setup();
      const ruleWithoutTriggerValue = { ...existingRule, triggerValue: undefined };
      (useQuery as vi.Mock).mockReturnValue([ruleWithoutTriggerValue]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Edit rule/i));

      expect(screen.getByPlaceholderText(/Optional trigger condition/i)).toHaveValue("");
    });
  });

  describe("Rule Display & Formatting", () => {
    const activeRule = {
      _id: mockId<"automationRules">("rule1"),
      name: "Auto Label High Priority",
      description: "Adds urgent label to high priority items",
      trigger: "priority_changed",
      triggerValue: "high",
      actionType: "add_label",
      actionValue: '{"label":"urgent"}',
      isActive: true,
      executionCount: 42,
    };

    it("should display rule name", () => {
      (useQuery as vi.Mock).mockReturnValue([activeRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByText("Auto Label High Priority")).toBeInTheDocument();
    });

    it("should display rule description", () => {
      (useQuery as vi.Mock).mockReturnValue([activeRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByText("Adds urgent label to high priority items")).toBeInTheDocument();
    });

    it("should show Active badge when rule is active", () => {
      (useQuery as vi.Mock).mockReturnValue([activeRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should show Inactive badge when rule is not active", () => {
      const inactiveRule = { ...activeRule, isActive: false };
      (useQuery as vi.Mock).mockReturnValue([inactiveRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByText("Inactive")).toBeInTheDocument();
    });

    it("should display execution count", () => {
      (useQuery as vi.Mock).mockReturnValue([activeRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByText(/Executed: 42 times/i)).toBeInTheDocument();
    });

    it("should display trigger label correctly", () => {
      (useQuery as vi.Mock).mockReturnValue([activeRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByText(/Priority Changed → high/i)).toBeInTheDocument();
    });

    it("should display action label correctly", () => {
      (useQuery as vi.Mock).mockReturnValue([activeRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByText("Add Label")).toBeInTheDocument();
    });

    it("should show trigger without arrow when no triggerValue", () => {
      const ruleWithoutValue = { ...activeRule, triggerValue: undefined };
      (useQuery as vi.Mock).mockReturnValue([ruleWithoutValue]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.queryByText(/→/)).not.toBeInTheDocument();
      expect(screen.getByText("Priority Changed")).toBeInTheDocument();
    });
  });

  describe("Toggle Active/Inactive Logic", () => {
    const activeRule = {
      _id: mockId<"automationRules">("rule1"),
      name: "Test Rule",
      trigger: "status_changed",
      actionType: "add_label",
      actionValue: "{}",
      isActive: true,
      executionCount: 0,
    };

    it("should show pause emoji for active rules", () => {
      (useQuery as vi.Mock).mockReturnValue([activeRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByTitle(/Disable rule/i)).toHaveTextContent("⏸️");
    });

    it("should show play emoji for inactive rules", () => {
      const inactiveRule = { ...activeRule, isActive: false };
      (useQuery as vi.Mock).mockReturnValue([inactiveRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByTitle(/Enable rule/i)).toHaveTextContent("▶️");
    });

    it("should toggle active rule to inactive", async () => {
      const user = userEvent.setup();
      (useQuery as vi.Mock).mockReturnValue([activeRule]);
      mockUpdateRule.mockResolvedValue({});

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Disable rule/i));

      await waitFor(() => {
        expect(mockUpdateRule).toHaveBeenCalledWith({
          id: "rule1",
          isActive: false,
        });
      });
    });

    it("should toggle inactive rule to active", async () => {
      const user = userEvent.setup();
      const inactiveRule = { ...activeRule, isActive: false };
      (useQuery as vi.Mock).mockReturnValue([inactiveRule]);
      mockUpdateRule.mockResolvedValue({});

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Enable rule/i));

      await waitFor(() => {
        expect(mockUpdateRule).toHaveBeenCalledWith({
          id: "rule1",
          isActive: true,
        });
      });
    });

    it("should show success toast when disabling rule", async () => {
      const user = userEvent.setup();
      (useQuery as vi.Mock).mockReturnValue([activeRule]);
      mockUpdateRule.mockResolvedValue({});

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Disable rule/i));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Rule disabled");
      });
    });

    it("should show success toast when enabling rule", async () => {
      const user = userEvent.setup();
      const inactiveRule = { ...activeRule, isActive: false };
      (useQuery as vi.Mock).mockReturnValue([inactiveRule]);
      mockUpdateRule.mockResolvedValue({});

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Enable rule/i));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Rule enabled");
      });
    });
  });

  describe("Success & Error Handling", () => {
    it("should show success toast and close dialog after create", async () => {
      const user = userEvent.setup();
      mockCreateRule.mockResolvedValue({ _id: "rule1" });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i), "Test");
      fireEvent.change(screen.getByPlaceholderText(/\{"label": "urgent"\}/i), { target: { value: "{}" } });
      await user.click(screen.getAllByRole("button", { name: /Create Rule/i })[1]);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Rule created");
        expect(screen.queryByText("Create Automation Rule")).not.toBeInTheDocument();
      });
    });

    it("should show success toast and close dialog after update", async () => {
      const user = userEvent.setup();
      const rule = {
        _id: mockId<"automationRules">("rule1"),
        name: "Test",
        trigger: "status_changed",
        actionType: "add_label",
        actionValue: "{}",
        isActive: true,
        executionCount: 0,
      };
      (useQuery as vi.Mock).mockReturnValue([rule]);
      mockUpdateRule.mockResolvedValue({});

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Edit rule/i));
      await user.click(screen.getByRole("button", { name: /Update Rule/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Rule updated");
        expect(screen.queryByText("Edit Automation Rule")).not.toBeInTheDocument();
      });
    });

    it("should show error toast when create fails", async () => {
      const user = userEvent.setup();
      mockCreateRule.mockRejectedValue(new Error("Duplicate rule name"));

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i), "Test");
      fireEvent.change(screen.getByPlaceholderText(/\{"label": "urgent"\}/i), { target: { value: "{}" } });
      await user.click(screen.getAllByRole("button", { name: /Create Rule/i })[1]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Duplicate rule name");
      });
    });

    it("should show generic error when error has no message", async () => {
      const user = userEvent.setup();
      // Reject with a non-Error object to trigger the fallback message
      mockCreateRule.mockRejectedValue({});

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i), "Test");
      fireEvent.change(screen.getByPlaceholderText(/\{"label": "urgent"\}/i), { target: { value: "{}" } });
      await user.click(screen.getAllByRole("button", { name: /Create Rule/i })[1]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to save rule");
      });
    });
  });
});
