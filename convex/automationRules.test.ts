import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup";
import { createTestProject, createTestUser } from "./test-utils";

describe("Automation Rules", () => {
	describe("list", () => {
		it("should return automation rules for a project", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			// Create automation rule
			const ruleId = await t.mutation(api.automationRules.create, {
				projectId,
				name: "Auto-assign bugs",
				description: "Automatically assign bugs to lead",
				trigger: "issue_created",
				triggerValue: "bug",
				actionType: "set_assignee",
				actionValue: JSON.stringify({ assigneeId: userId }),
			});

			const rules = await t.query(api.automationRules.list, { projectId });

			expect(rules).toHaveLength(1);
			expect(rules[0]?._id).toBe(ruleId);
			expect(rules[0]?.name).toBe("Auto-assign bugs");
		});

		it("should return empty array for project with no rules", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			const rules = await t.query(api.automationRules.list, { projectId });

			expect(rules).toEqual([]);
		});

		it("should return empty array for unauthenticated users", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			const rules = await t.query(api.automationRules.list, { projectId });

			expect(rules).toEqual([]);
		});

		it("should return empty array for non-members", async () => {
			const t = convexTest(schema, modules);
			const owner = await createTestUser(t, { name: "Owner" });
			const other = await createTestUser(t, { name: "Other" });
			const projectId = await createTestProject(t, owner, { isPublic: false });

			t.withIdentity({ subject: other });

			const rules = await t.query(api.automationRules.list, { projectId });

			expect(rules).toEqual([]);
		});

		it("should return rules for project members", async () => {
			const t = convexTest(schema, modules);
			const owner = await createTestUser(t, { name: "Owner" });
			const member = await createTestUser(t, {
				name: "Member",
				email: "member@test.com",
			});
			const projectId = await createTestProject(t, owner);

			// Add member
			t.withIdentity({ subject: owner });
			await t.mutation(api.projects.addMember, {
				projectId,
				userEmail: "member@test.com",
				role: "viewer",
			});

			// Create rule
			await t.mutation(api.automationRules.create, {
				projectId,
				name: "Test Rule",
				trigger: "issue_created",
				actionType: "set_priority",
				actionValue: JSON.stringify({ priority: "high" }),
			});

			// Member views rules
			t.withIdentity({ subject: member });
			const rules = await t.query(api.automationRules.list, { projectId });

			expect(rules).toHaveLength(1);
		});
	});

	describe("create", () => {
		it("should create automation rule with all fields", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			const ruleId = await t.mutation(api.automationRules.create, {
				projectId,
				name: "Auto-prioritize bugs",
				description: "Set bugs to high priority",
				trigger: "issue_created",
				triggerValue: "bug",
				actionType: "set_priority",
				actionValue: JSON.stringify({ priority: "high" }),
			});

			const rule = await t.run(async (ctx) => {
				return await ctx.db.get(ruleId);
			});

			expect(rule?.name).toBe("Auto-prioritize bugs");
			expect(rule?.description).toBe("Set bugs to high priority");
			expect(rule?.trigger).toBe("issue_created");
			expect(rule?.triggerValue).toBe("bug");
			expect(rule?.actionType).toBe("set_priority");
			expect(rule?.isActive).toBe(true);
			expect(rule?.executionCount).toBe(0);
			expect(rule?.createdBy).toBe(userId);
		});

		it("should create rule with minimal fields", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			const ruleId = await t.mutation(api.automationRules.create, {
				projectId,
				name: "Simple Rule",
				trigger: "issue_created",
				actionType: "add_label",
				actionValue: JSON.stringify({ label: "automated" }),
			});

			const rule = await t.run(async (ctx) => {
				return await ctx.db.get(ruleId);
			});

			expect(rule?.name).toBe("Simple Rule");
			expect(rule?.description).toBeUndefined();
			expect(rule?.triggerValue).toBeUndefined();
		});

		it("should deny non-admin users", async () => {
			const t = convexTest(schema, modules);
			const owner = await createTestUser(t, { name: "Owner" });
			const editor = await createTestUser(t, {
				name: "Editor",
				email: "editor@test.com",
			});
			const projectId = await createTestProject(t, owner);

			// Add editor
			t.withIdentity({ subject: owner });
			await t.mutation(api.projects.addMember, {
				projectId,
				userEmail: "editor@test.com",
				role: "editor",
			});

			// Editor tries to create rule
			t.withIdentity({ subject: editor });
			await expect(async () => {
				await t.mutation(api.automationRules.create, {
					projectId,
					name: "Rule",
					trigger: "issue_created",
					actionType: "set_priority",
					actionValue: JSON.stringify({ priority: "high" }),
				});
			}).rejects.toThrow();
		});

		it("should deny unauthenticated users", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: undefined });
			await expect(async () => {
				await t.mutation(api.automationRules.create, {
					projectId,
					name: "Rule",
					trigger: "issue_created",
					actionType: "set_priority",
					actionValue: JSON.stringify({ priority: "high" }),
				});
			}).rejects.toThrow("Not authenticated");
		});
	});

	describe("update", () => {
		it("should update automation rule fields", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			const ruleId = await t.mutation(api.automationRules.create, {
				projectId,
				name: "Original Name",
				trigger: "issue_created",
				actionType: "set_priority",
				actionValue: JSON.stringify({ priority: "medium" }),
			});

			await t.mutation(api.automationRules.update, {
				id: ruleId,
				name: "Updated Name",
				description: "Added description",
				actionValue: JSON.stringify({ priority: "high" }),
			});

			const rule = await t.run(async (ctx) => {
				return await ctx.db.get(ruleId);
			});

			expect(rule?.name).toBe("Updated Name");
			expect(rule?.description).toBe("Added description");
			expect(rule?.actionValue).toBe(JSON.stringify({ priority: "high" }));
		});

		it("should toggle isActive status", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			const ruleId = await t.mutation(api.automationRules.create, {
				projectId,
				name: "Test Rule",
				trigger: "issue_created",
				actionType: "set_priority",
				actionValue: JSON.stringify({ priority: "high" }),
			});

			// Deactivate
			await t.mutation(api.automationRules.update, {
				id: ruleId,
				isActive: false,
			});

			let rule = await t.run(async (ctx) => {
				return await ctx.db.get(ruleId);
			});
			expect(rule?.isActive).toBe(false);

			// Reactivate
			await t.mutation(api.automationRules.update, {
				id: ruleId,
				isActive: true,
			});

			rule = await t.run(async (ctx) => {
				return await ctx.db.get(ruleId);
			});
			expect(rule?.isActive).toBe(true);
		});

		it("should update only specified fields", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			const ruleId = await t.mutation(api.automationRules.create, {
				projectId,
				name: "Original Name",
				description: "Original Description",
				trigger: "issue_created",
				actionType: "set_priority",
				actionValue: JSON.stringify({ priority: "medium" }),
			});

			// Update only name
			await t.mutation(api.automationRules.update, {
				id: ruleId,
				name: "New Name",
			});

			const rule = await t.run(async (ctx) => {
				return await ctx.db.get(ruleId);
			});

			expect(rule?.name).toBe("New Name");
			expect(rule?.description).toBe("Original Description"); // Unchanged
		});

		it("should deny non-admin users", async () => {
			const t = convexTest(schema, modules);
			const owner = await createTestUser(t, { name: "Owner" });
			const editor = await createTestUser(t, {
				name: "Editor",
				email: "editor@test.com",
			});
			const projectId = await createTestProject(t, owner);

			// Add editor
			t.withIdentity({ subject: owner });
			await t.mutation(api.projects.addMember, {
				projectId,
				userEmail: "editor@test.com",
				role: "editor",
			});

			const ruleId = await t.mutation(api.automationRules.create, {
				projectId,
				name: "Test Rule",
				trigger: "issue_created",
				actionType: "set_priority",
				actionValue: JSON.stringify({ priority: "high" }),
			});

			// Editor tries to update
			t.withIdentity({ subject: editor });
			await expect(async () => {
				await t.mutation(api.automationRules.update, {
					id: ruleId,
					name: "Hacked",
				});
			}).rejects.toThrow();
		});

		it("should deny unauthenticated users", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });
			const ruleId = await t.mutation(api.automationRules.create, {
				projectId,
				name: "Test Rule",
				trigger: "issue_created",
				actionType: "set_priority",
				actionValue: JSON.stringify({ priority: "high" }),
			});

			t.withIdentity({ subject: undefined });
			await expect(async () => {
				await t.mutation(api.automationRules.update, {
					id: ruleId,
					name: "Hacked",
				});
			}).rejects.toThrow("Not authenticated");
		});

		it("should throw error for non-existent rule", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			const fakeId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as any;

			await expect(async () => {
				await t.mutation(api.automationRules.update, {
					id: fakeId,
					name: "Test",
				});
			}).rejects.toThrow("Rule not found");
		});
	});

	describe("remove", () => {
		it("should delete automation rule", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			const ruleId = await t.mutation(api.automationRules.create, {
				projectId,
				name: "To Delete",
				trigger: "issue_created",
				actionType: "set_priority",
				actionValue: JSON.stringify({ priority: "high" }),
			});

			await t.mutation(api.automationRules.remove, { id: ruleId });

			const rule = await t.run(async (ctx) => {
				return await ctx.db.get(ruleId);
			});

			expect(rule).toBeNull();
		});

		it("should deny non-admin users", async () => {
			const t = convexTest(schema, modules);
			const owner = await createTestUser(t, { name: "Owner" });
			const editor = await createTestUser(t, {
				name: "Editor",
				email: "editor@test.com",
			});
			const projectId = await createTestProject(t, owner);

			// Add editor
			t.withIdentity({ subject: owner });
			await t.mutation(api.projects.addMember, {
				projectId,
				userEmail: "editor@test.com",
				role: "editor",
			});

			const ruleId = await t.mutation(api.automationRules.create, {
				projectId,
				name: "Test Rule",
				trigger: "issue_created",
				actionType: "set_priority",
				actionValue: JSON.stringify({ priority: "high" }),
			});

			// Editor tries to delete
			t.withIdentity({ subject: editor });
			await expect(async () => {
				await t.mutation(api.automationRules.remove, { id: ruleId });
			}).rejects.toThrow();
		});

		it("should deny unauthenticated users", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });
			const ruleId = await t.mutation(api.automationRules.create, {
				projectId,
				name: "Test Rule",
				trigger: "issue_created",
				actionType: "set_priority",
				actionValue: JSON.stringify({ priority: "high" }),
			});

			t.withIdentity({ subject: undefined });
			await expect(async () => {
				await t.mutation(api.automationRules.remove, { id: ruleId });
			}).rejects.toThrow("Not authenticated");
		});

		it("should throw error for non-existent rule", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			const fakeId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as any;

			await expect(async () => {
				await t.mutation(api.automationRules.remove, { id: fakeId });
			}).rejects.toThrow("Rule not found");
		});
	});

	describe("executeRules (internal)", () => {
		it("should execute set_assignee action", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const assignee = await createTestUser(t, { name: "Assignee" });
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			// Create rule to auto-assign
			await t.mutation(api.automationRules.create, {
				projectId,
				name: "Auto-assign",
				trigger: "issue_created",
				actionType: "set_assignee",
				actionValue: JSON.stringify({ assigneeId: assignee }),
			});

			// Create issue
			const issueId = await t.mutation(api.issues.create, {
				projectId,
				title: "Test Issue",
				type: "task",
				priority: "medium",
			});

			// Execute rules
			await t.run(async (ctx) => {
				const { executeRules } = await import("./automationRules");
				await executeRules(ctx, {
					projectId,
					issueId,
					trigger: "issue_created",
				});
			});

			// Check if assignee was set
			const issue = await t.query(api.issues.get, { id: issueId });
			expect(issue?.assigneeId).toBe(assignee);
		});

		it("should execute set_priority action", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			// Create rule to set priority
			await t.mutation(api.automationRules.create, {
				projectId,
				name: "Auto-prioritize",
				trigger: "issue_created",
				triggerValue: "bug",
				actionType: "set_priority",
				actionValue: JSON.stringify({ priority: "highest" }),
			});

			// Create bug issue
			const issueId = await t.mutation(api.issues.create, {
				projectId,
				title: "Bug Issue",
				type: "bug",
				priority: "medium",
			});

			// Execute rules
			await t.run(async (ctx) => {
				const { executeRules } = await import("./automationRules");
				await executeRules(ctx, {
					projectId,
					issueId,
					trigger: "issue_created",
					triggerValue: "bug",
				});
			});

			// Check if priority was set
			const issue = await t.query(api.issues.get, { id: issueId });
			expect(issue?.priority).toBe("highest");
		});

		it("should execute add_label action", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			// Create rule to add label
			await t.mutation(api.automationRules.create, {
				projectId,
				name: "Auto-label",
				trigger: "issue_created",
				actionType: "add_label",
				actionValue: JSON.stringify({ label: "automated" }),
			});

			// Create issue
			const issueId = await t.mutation(api.issues.create, {
				projectId,
				title: "Test Issue",
				type: "task",
				priority: "medium",
			});

			// Execute rules
			await t.run(async (ctx) => {
				const { executeRules } = await import("./automationRules");
				await executeRules(ctx, {
					projectId,
					issueId,
					trigger: "issue_created",
				});
			});

			// Check if label was added
			const issue = await t.query(api.issues.get, { id: issueId });
			expect(issue?.labels).toContain("automated");
		});

		it("should execute add_comment action", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			// Create rule to add comment
			await t.mutation(api.automationRules.create, {
				projectId,
				name: "Auto-comment",
				trigger: "issue_created",
				actionType: "add_comment",
				actionValue: JSON.stringify({
					comment: "This issue was automatically created",
				}),
			});

			// Create issue
			const issueId = await t.mutation(api.issues.create, {
				projectId,
				title: "Test Issue",
				type: "task",
				priority: "medium",
			});

			// Execute rules
			await t.run(async (ctx) => {
				const { executeRules } = await import("./automationRules");
				await executeRules(ctx, {
					projectId,
					issueId,
					trigger: "issue_created",
				});
			});

			// Check if comment was added
			const comments = await t.query(api.issues.getComments, { issueId });
			expect(comments).toHaveLength(1);
			expect(comments[0]?.content).toBe("This issue was automatically created");
		});

		it("should only execute active rules", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			// Create inactive rule
			const ruleId = await t.mutation(api.automationRules.create, {
				projectId,
				name: "Inactive Rule",
				trigger: "issue_created",
				actionType: "set_priority",
				actionValue: JSON.stringify({ priority: "highest" }),
			});

			// Deactivate rule
			await t.mutation(api.automationRules.update, {
				id: ruleId,
				isActive: false,
			});

			// Create issue
			const issueId = await t.mutation(api.issues.create, {
				projectId,
				title: "Test Issue",
				type: "task",
				priority: "medium",
			});

			// Execute rules
			await t.run(async (ctx) => {
				const { executeRules } = await import("./automationRules");
				await executeRules(ctx, {
					projectId,
					issueId,
					trigger: "issue_created",
				});
			});

			// Priority should NOT be changed
			const issue = await t.query(api.issues.get, { id: issueId });
			expect(issue?.priority).toBe("medium");
		});

		it("should increment execution count", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			// Create rule
			const ruleId = await t.mutation(api.automationRules.create, {
				projectId,
				name: "Test Rule",
				trigger: "issue_created",
				actionType: "add_label",
				actionValue: JSON.stringify({ label: "automated" }),
			});

			// Create first issue
			const issue1Id = await t.mutation(api.issues.create, {
				projectId,
				title: "Issue 1",
				type: "task",
				priority: "medium",
			});

			await t.run(async (ctx) => {
				const { executeRules } = await import("./automationRules");
				await executeRules(ctx, {
					projectId,
					issueId: issue1Id,
					trigger: "issue_created",
				});
			});

			// Create second issue
			const issue2Id = await t.mutation(api.issues.create, {
				projectId,
				title: "Issue 2",
				type: "task",
				priority: "medium",
			});

			await t.run(async (ctx) => {
				const { executeRules } = await import("./automationRules");
				await executeRules(ctx, {
					projectId,
					issueId: issue2Id,
					trigger: "issue_created",
				});
			});

			// Check execution count
			const rule = await t.run(async (ctx) => {
				return await ctx.db.get(ruleId);
			});

			expect(rule?.executionCount).toBe(2);
		});

		it("should match trigger value when specified", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			// Create rule that only triggers for bugs
			await t.mutation(api.automationRules.create, {
				projectId,
				name: "Bug Rule",
				trigger: "issue_created",
				triggerValue: "bug",
				actionType: "set_priority",
				actionValue: JSON.stringify({ priority: "highest" }),
			});

			// Create task (should NOT trigger)
			const taskId = await t.mutation(api.issues.create, {
				projectId,
				title: "Task",
				type: "task",
				priority: "medium",
			});

			await t.run(async (ctx) => {
				const { executeRules } = await import("./automationRules");
				await executeRules(ctx, {
					projectId,
					issueId: taskId,
					trigger: "issue_created",
					triggerValue: "task",
				});
			});

			const task = await t.query(api.issues.get, { id: taskId });
			expect(task?.priority).toBe("medium"); // Unchanged

			// Create bug (should trigger)
			const bugId = await t.mutation(api.issues.create, {
				projectId,
				title: "Bug",
				type: "bug",
				priority: "medium",
			});

			await t.run(async (ctx) => {
				const { executeRules } = await import("./automationRules");
				await executeRules(ctx, {
					projectId,
					issueId: bugId,
					trigger: "issue_created",
					triggerValue: "bug",
				});
			});

			const bug = await t.query(api.issues.get, { id: bugId });
			expect(bug?.priority).toBe("highest"); // Changed
		});
	});
});
