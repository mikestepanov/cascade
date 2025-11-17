import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup";
import { createTestProject, createTestUser } from "./test-utils";

describe("Analytics", () => {
	describe("getProjectAnalytics", () => {
		it("should return analytics for a project", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			// Create some test issues
			await t.mutation(api.issues.create, {
				projectId,
				title: "Task 1",
				type: "task",
				priority: "high",
			});
			await t.mutation(api.issues.create, {
				projectId,
				title: "Bug 1",
				type: "bug",
				priority: "medium",
			});
			await t.mutation(api.issues.create, {
				projectId,
				title: "Story 1",
				type: "story",
				priority: "low",
			});

			const analytics = await t.query(api.analytics.getProjectAnalytics, {
				projectId,
			});

			expect(analytics.totalIssues).toBe(3);
			expect(analytics.issuesByType.task).toBe(1);
			expect(analytics.issuesByType.bug).toBe(1);
			expect(analytics.issuesByType.story).toBe(1);
			expect(analytics.issuesByType.epic).toBe(0);
			expect(analytics.issuesByPriority.high).toBe(1);
			expect(analytics.issuesByPriority.medium).toBe(1);
			expect(analytics.issuesByPriority.low).toBe(1);
			expect(analytics.unassignedCount).toBe(3);
		});

		it("should count issues by status correctly", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			// Get workflow states
			const project = await t.query(api.projects.get, { id: projectId });
			const todoState = project?.workflowStates.find((s) => s.name === "To Do");
			const inProgressState = project?.workflowStates.find(
				(s) => s.name === "In Progress",
			);
			const doneState = project?.workflowStates.find((s) => s.name === "Done");

			// Create issues in different states
			const issue1 = await t.mutation(api.issues.create, {
				projectId,
				title: "Issue 1",
				type: "task",
				priority: "medium",
			});
			const issue2 = await t.mutation(api.issues.create, {
				projectId,
				title: "Issue 2",
				type: "task",
				priority: "medium",
			});
			const issue3 = await t.mutation(api.issues.create, {
				projectId,
				title: "Issue 3",
				type: "task",
				priority: "medium",
			});

			// Move issues to different states
			if (inProgressState) {
				await t.mutation(api.issues.updateStatus, {
					id: issue2,
					status: inProgressState.id,
				});
			}
			if (doneState) {
				await t.mutation(api.issues.updateStatus, {
					id: issue3,
					status: doneState.id,
				});
			}

			const analytics = await t.query(api.analytics.getProjectAnalytics, {
				projectId,
			});

			expect(analytics.totalIssues).toBe(3);
			if (todoState) {
				expect(analytics.issuesByStatus[todoState.id]).toBe(1);
			}
			if (inProgressState) {
				expect(analytics.issuesByStatus[inProgressState.id]).toBe(1);
			}
			if (doneState) {
				expect(analytics.issuesByStatus[doneState.id]).toBe(1);
			}
		});

		it("should count issues by assignee", async () => {
			const t = convexTest(schema, modules);
			const user1 = await createTestUser(t, { name: "User 1" });
			const user2 = await createTestUser(t, { name: "User 2" });
			const projectId = await createTestProject(t, user1);

			t.withIdentity({ subject: user1 });

			// Create issues with different assignees
			await t.mutation(api.issues.create, {
				projectId,
				title: "Task 1",
				type: "task",
				priority: "medium",
				assigneeId: user1,
			});
			await t.mutation(api.issues.create, {
				projectId,
				title: "Task 2",
				type: "task",
				priority: "medium",
				assigneeId: user1,
			});
			await t.mutation(api.issues.create, {
				projectId,
				title: "Task 3",
				type: "task",
				priority: "medium",
				assigneeId: user2,
			});
			await t.mutation(api.issues.create, {
				projectId,
				title: "Task 4",
				type: "task",
				priority: "medium",
			}); // Unassigned

			const analytics = await t.query(api.analytics.getProjectAnalytics, {
				projectId,
			});

			expect(analytics.totalIssues).toBe(4);
			expect(analytics.issuesByAssignee[user1]?.count).toBe(2);
			expect(analytics.issuesByAssignee[user2]?.count).toBe(1);
			expect(analytics.unassignedCount).toBe(1);
		});

		it("should return empty analytics for project with no issues", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			const analytics = await t.query(api.analytics.getProjectAnalytics, {
				projectId,
			});

			expect(analytics.totalIssues).toBe(0);
			expect(analytics.issuesByType.task).toBe(0);
			expect(analytics.unassignedCount).toBe(0);
		});

		it("should deny unauthenticated users", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: undefined });

			await expect(async () => {
				await t.query(api.analytics.getProjectAnalytics, { projectId });
			}).rejects.toThrow("Not authenticated");
		});

		it("should deny unauthorized users", async () => {
			const t = convexTest(schema, modules);
			const owner = await createTestUser(t, { name: "Owner" });
			const other = await createTestUser(t, { name: "Other" });
			const projectId = await createTestProject(t, owner, { isPublic: false });

			t.withIdentity({ subject: other });

			await expect(async () => {
				await t.query(api.analytics.getProjectAnalytics, { projectId });
			}).rejects.toThrow("Not authorized");
		});

		it("should throw error for non-existent project", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			const fakeProjectId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as any;

			await expect(async () => {
				await t.query(api.analytics.getProjectAnalytics, {
					projectId: fakeProjectId,
				});
			}).rejects.toThrow("Project not found");
		});
	});

	describe("getSprintBurndown", () => {
		it("should return burndown data for a sprint", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			// Create sprint with dates
			const startDate = Date.now();
			const endDate = startDate + 14 * 24 * 60 * 60 * 1000; // 2 weeks
			const sprintId = await t.mutation(api.sprints.create, {
				projectId,
				name: "Sprint 1",
				startDate,
				endDate,
			});

			// Create issues with story points
			await t.mutation(api.issues.create, {
				projectId,
				title: "Task 1",
				type: "task",
				priority: "medium",
				sprintId,
				estimatedHours: 5,
			});
			await t.mutation(api.issues.create, {
				projectId,
				title: "Task 2",
				type: "task",
				priority: "medium",
				sprintId,
				estimatedHours: 8,
			});

			const burndown = await t.query(api.analytics.getSprintBurndown, {
				sprintId,
			});

			expect(burndown.totalPoints).toBe(13); // 5 + 8
			expect(burndown.totalIssues).toBe(2);
			expect(burndown.completedPoints).toBe(0); // None completed yet
			expect(burndown.remainingPoints).toBe(13);
			expect(burndown.progressPercentage).toBe(0);
			expect(burndown.idealBurndown.length).toBeGreaterThan(0);
			expect(burndown.totalDays).toBe(14);
		});

		it("should calculate completed points correctly", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			const sprintId = await t.mutation(api.sprints.create, {
				projectId,
				name: "Sprint 1",
			});

			// Get done state
			const project = await t.query(api.projects.get, { id: projectId });
			const doneState = project?.workflowStates.find((s) => s.name === "Done");

			// Create issues
			const issue1 = await t.mutation(api.issues.create, {
				projectId,
				title: "Task 1",
				type: "task",
				priority: "medium",
				sprintId,
				estimatedHours: 5,
			});
			const issue2 = await t.mutation(api.issues.create, {
				projectId,
				title: "Task 2",
				type: "task",
				priority: "medium",
				sprintId,
				estimatedHours: 8,
			});

			// Complete one issue
			if (doneState) {
				await t.mutation(api.issues.updateStatus, {
					id: issue1,
					status: doneState.id,
				});
			}

			const burndown = await t.query(api.analytics.getSprintBurndown, {
				sprintId,
			});

			expect(burndown.totalPoints).toBe(13);
			expect(burndown.completedPoints).toBe(5);
			expect(burndown.remainingPoints).toBe(8);
			expect(burndown.completedIssues).toBe(1);
			expect(burndown.progressPercentage).toBe(38); // 5/13 ≈ 38%
		});

		it("should handle sprint with no dates", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			const sprintId = await t.mutation(api.sprints.create, {
				projectId,
				name: "Sprint 1",
			});

			await t.mutation(api.issues.create, {
				projectId,
				title: "Task 1",
				type: "task",
				priority: "medium",
				sprintId,
				estimatedHours: 5,
			});

			const burndown = await t.query(api.analytics.getSprintBurndown, {
				sprintId,
			});

			expect(burndown.totalPoints).toBe(5);
			expect(burndown.idealBurndown).toEqual([]);
			expect(burndown.totalDays).toBe(0);
			expect(burndown.daysElapsed).toBe(0);
		});

		it("should handle sprint with no issues", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			const sprintId = await t.mutation(api.sprints.create, {
				projectId,
				name: "Sprint 1",
			});

			const burndown = await t.query(api.analytics.getSprintBurndown, {
				sprintId,
			});

			expect(burndown.totalPoints).toBe(0);
			expect(burndown.totalIssues).toBe(0);
			expect(burndown.progressPercentage).toBe(0);
		});

		it("should deny unauthenticated users", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });
			const sprintId = await t.mutation(api.sprints.create, {
				projectId,
				name: "Sprint 1",
			});

			t.withIdentity({ subject: undefined });

			await expect(async () => {
				await t.query(api.analytics.getSprintBurndown, { sprintId });
			}).rejects.toThrow("Not authenticated");
		});

		it("should deny unauthorized users", async () => {
			const t = convexTest(schema, modules);
			const owner = await createTestUser(t, { name: "Owner" });
			const other = await createTestUser(t, { name: "Other" });
			const projectId = await createTestProject(t, owner, { isPublic: false });

			t.withIdentity({ subject: owner });
			const sprintId = await t.mutation(api.sprints.create, {
				projectId,
				name: "Sprint 1",
			});

			t.withIdentity({ subject: other });

			await expect(async () => {
				await t.query(api.analytics.getSprintBurndown, { sprintId });
			}).rejects.toThrow("Not authorized");
		});

		it("should throw error for non-existent sprint", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			const fakeSprintId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as any;

			await expect(async () => {
				await t.query(api.analytics.getSprintBurndown, {
					sprintId: fakeSprintId,
				});
			}).rejects.toThrow("Sprint not found");
		});
	});

	describe("getTeamVelocity", () => {
		it("should calculate team velocity from completed sprints", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			// Get done state
			const project = await t.query(api.projects.get, { id: projectId });
			const doneState = project?.workflowStates.find((s) => s.name === "Done");

			// Create and complete sprint 1
			const sprint1Id = await t.mutation(api.sprints.create, {
				projectId,
				name: "Sprint 1",
			});
			const issue1 = await t.mutation(api.issues.create, {
				projectId,
				title: "Task 1",
				type: "task",
				priority: "medium",
				sprintId: sprint1Id,
				estimatedHours: 10,
			});
			if (doneState) {
				await t.mutation(api.issues.updateStatus, {
					id: issue1,
					status: doneState.id,
				});
			}
			await t.mutation(api.sprints.completeSprint, { sprintId: sprint1Id });

			// Create and complete sprint 2
			const sprint2Id = await t.mutation(api.sprints.create, {
				projectId,
				name: "Sprint 2",
			});
			const issue2 = await t.mutation(api.issues.create, {
				projectId,
				title: "Task 2",
				type: "task",
				priority: "medium",
				sprintId: sprint2Id,
				estimatedHours: 8,
			});
			if (doneState) {
				await t.mutation(api.issues.updateStatus, {
					id: issue2,
					status: doneState.id,
				});
			}
			await t.mutation(api.sprints.completeSprint, { sprintId: sprint2Id });

			const velocity = await t.query(api.analytics.getTeamVelocity, {
				projectId,
			});

			expect(velocity.velocityData).toHaveLength(2);
			expect(velocity.velocityData[0]?.sprintName).toBe("Sprint 1");
			expect(velocity.velocityData[0]?.points).toBe(10);
			expect(velocity.velocityData[1]?.sprintName).toBe("Sprint 2");
			expect(velocity.velocityData[1]?.points).toBe(8);
			expect(velocity.averageVelocity).toBe(9); // (10 + 8) / 2
		});

		it("should only include completed sprints", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			// Create completed sprint
			const completedSprintId = await t.mutation(api.sprints.create, {
				projectId,
				name: "Completed Sprint",
			});
			await t.mutation(api.sprints.completeSprint, {
				sprintId: completedSprintId,
			});

			// Create active sprint
			const activeSprintId = await t.mutation(api.sprints.create, {
				projectId,
				name: "Active Sprint",
			});
			await t.mutation(api.sprints.startSprint, {
				sprintId: activeSprintId,
				startDate: Date.now(),
				endDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
			});

			// Create future sprint
			await t.mutation(api.sprints.create, {
				projectId,
				name: "Future Sprint",
			});

			const velocity = await t.query(api.analytics.getTeamVelocity, {
				projectId,
			});

			expect(velocity.velocityData).toHaveLength(1);
			expect(velocity.velocityData[0]?.sprintName).toBe("Completed Sprint");
		});

		it("should return zero velocity for project with no completed sprints", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			const velocity = await t.query(api.analytics.getTeamVelocity, {
				projectId,
			});

			expect(velocity.velocityData).toEqual([]);
			expect(velocity.averageVelocity).toBe(0);
		});

		it("should only count completed issues in velocity", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			const project = await t.query(api.projects.get, { id: projectId });
			const doneState = project?.workflowStates.find((s) => s.name === "Done");

			const sprintId = await t.mutation(api.sprints.create, {
				projectId,
				name: "Sprint 1",
			});

			// Create completed issue
			const completedIssue = await t.mutation(api.issues.create, {
				projectId,
				title: "Completed Task",
				type: "task",
				priority: "medium",
				sprintId,
				estimatedHours: 10,
			});

			// Create incomplete issue
			await t.mutation(api.issues.create, {
				projectId,
				title: "Incomplete Task",
				type: "task",
				priority: "medium",
				sprintId,
				estimatedHours: 5,
			});

			// Complete one issue
			if (doneState) {
				await t.mutation(api.issues.updateStatus, {
					id: completedIssue,
					status: doneState.id,
				});
			}

			await t.mutation(api.sprints.completeSprint, { sprintId });

			const velocity = await t.query(api.analytics.getTeamVelocity, {
				projectId,
			});

			expect(velocity.velocityData[0]?.points).toBe(10); // Only completed task
			expect(velocity.velocityData[0]?.issuesCompleted).toBe(1);
		});

		it("should deny unauthenticated users", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: undefined });

			await expect(async () => {
				await t.query(api.analytics.getTeamVelocity, { projectId });
			}).rejects.toThrow("Not authenticated");
		});

		it("should deny unauthorized users", async () => {
			const t = convexTest(schema, modules);
			const owner = await createTestUser(t, { name: "Owner" });
			const other = await createTestUser(t, { name: "Other" });
			const projectId = await createTestProject(t, owner, { isPublic: false });

			t.withIdentity({ subject: other });

			await expect(async () => {
				await t.query(api.analytics.getTeamVelocity, { projectId });
			}).rejects.toThrow("Not authorized");
		});

		it("should throw error for non-existent project", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			const fakeProjectId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as any;

			await expect(async () => {
				await t.query(api.analytics.getTeamVelocity, {
					projectId: fakeProjectId,
				});
			}).rejects.toThrow("Project not found");
		});
	});

	describe("getRecentActivity", () => {
		it("should return recent activity for a project", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t, { name: "Test User" });
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			// Create issue (generates activity)
			const issueId = await t.mutation(api.issues.create, {
				projectId,
				title: "Test Issue",
				type: "task",
				priority: "medium",
			});

			// Update issue (generates more activity)
			await t.mutation(api.issues.update, {
				id: issueId,
				title: "Updated Issue",
			});

			const activity = await t.query(api.analytics.getRecentActivity, {
				projectId,
				limit: 10,
			});

			expect(activity.length).toBeGreaterThan(0);
			expect(activity[0]).toHaveProperty("userName");
			expect(activity[0]).toHaveProperty("issueKey");
			expect(activity[0]).toHaveProperty("issueTitle");
			expect(activity[0]).toHaveProperty("action");
		});

		it("should respect limit parameter", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			// Create multiple issues to generate activity
			for (let i = 0; i < 10; i++) {
				await t.mutation(api.issues.create, {
					projectId,
					title: `Issue ${i}`,
					type: "task",
					priority: "medium",
				});
			}

			const activity = await t.query(api.analytics.getRecentActivity, {
				projectId,
				limit: 5,
			});

			expect(activity.length).toBeLessThanOrEqual(5);
		});

		it("should use default limit when not specified", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			const activity = await t.query(api.analytics.getRecentActivity, {
				projectId,
			});

			expect(activity).toBeDefined();
			expect(Array.isArray(activity)).toBe(true);
		});

		it("should return empty array for project with no activity", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });

			const activity = await t.query(api.analytics.getRecentActivity, {
				projectId,
			});

			expect(activity).toEqual([]);
		});

		it("should deny unauthenticated users", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: undefined });

			await expect(async () => {
				await t.query(api.analytics.getRecentActivity, { projectId });
			}).rejects.toThrow("Not authenticated");
		});

		it("should deny unauthorized users", async () => {
			const t = convexTest(schema, modules);
			const owner = await createTestUser(t, { name: "Owner" });
			const other = await createTestUser(t, { name: "Other" });
			const projectId = await createTestProject(t, owner, { isPublic: false });

			t.withIdentity({ subject: other });

			await expect(async () => {
				await t.query(api.analytics.getRecentActivity, { projectId });
			}).rejects.toThrow("Not authorized");
		});
	});
});
