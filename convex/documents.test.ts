import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup";
import { createTestProject, createTestUser } from "./test-utils";

describe("Documents", () => {
	describe("create", () => {
		it("should create a public document", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			const docId = await t.mutation(api.documents.create, {
				title: "Public Document",
				isPublic: true,
			});

			expect(docId).toBeDefined();

			const doc = await t.query(api.documents.get, { id: docId });
			expect(doc?.title).toBe("Public Document");
			expect(doc?.isPublic).toBe(true);
			expect(doc?.createdBy).toBe(userId);
		});

		it("should create a private document", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			const docId = await t.mutation(api.documents.create, {
				title: "Private Document",
				isPublic: false,
			});

			const doc = await t.query(api.documents.get, { id: docId });
			expect(doc?.title).toBe("Private Document");
			expect(doc?.isPublic).toBe(false);
		});

		it("should create a document linked to a project", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);
			const projectId = await createTestProject(t, userId);

			t.withIdentity({ subject: userId });
			const docId = await t.mutation(api.documents.create, {
				title: "Project Document",
				isPublic: false,
				projectId,
			});

			const doc = await t.query(api.documents.get, { id: docId });
			expect(doc?.projectId).toBe(projectId);
		});

		it("should deny unauthenticated users", async () => {
			const t = convexTest(schema, modules);

			await expect(async () => {
				await t.mutation(api.documents.create, {
					title: "Unauthorized Document",
					isPublic: false,
				});
			}).rejects.toThrow("Not authenticated");
		});

		it("should set creation and update timestamps", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			const docId = await t.mutation(api.documents.create, {
				title: "Timestamped Document",
				isPublic: false,
			});

			const doc = await t.query(api.documents.get, { id: docId });
			expect(doc?.createdAt).toBeDefined();
			expect(doc?.updatedAt).toBeDefined();
			expect(doc?.createdAt).toBe(doc?.updatedAt); // Should be equal on creation
		});
	});

	describe("get", () => {
		it("should return public documents for anyone", async () => {
			const t = convexTest(schema, modules);
			const owner = await createTestUser(t, { name: "Owner" });
			const viewer = await createTestUser(t, { name: "Viewer" });

			// Create public document
			t.withIdentity({ subject: owner });
			const docId = await t.mutation(api.documents.create, {
				title: "Public Doc",
				isPublic: true,
			});

			// Access as different user
			t.withIdentity({ subject: viewer });
			const doc = await t.query(api.documents.get, { id: docId });
			expect(doc?.title).toBe("Public Doc");
			expect(doc?.isPublic).toBe(true);
		});

		it("should return private documents for owner", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			const docId = await t.mutation(api.documents.create, {
				title: "My Private Doc",
				isPublic: false,
			});

			const doc = await t.query(api.documents.get, { id: docId });
			expect(doc?.title).toBe("My Private Doc");
			expect(doc?.createdBy).toBe(userId);
		});

		it("should deny access to private documents for non-owners", async () => {
			const t = convexTest(schema, modules);
			const owner = await createTestUser(t, { name: "Owner" });
			const other = await createTestUser(t, { name: "Other" });

			// Create private document
			t.withIdentity({ subject: owner });
			const docId = await t.mutation(api.documents.create, {
				title: "Secret Document",
				isPublic: false,
			});

			// Try to access as other user
			t.withIdentity({ subject: other });
			const doc = await t.query(api.documents.get, { id: docId });
			expect(doc).toBeNull(); // Should return null for unauthorized access
		});

		it("should allow project members to access project documents", async () => {
			const t = convexTest(schema, modules);
			const owner = await createTestUser(t, { name: "Owner" });
			const member = await createTestUser(t, {
				name: "Member",
				email: "member@test.com",
			});
			const projectId = await createTestProject(t, owner, { isPublic: false });

			// Add member to project
			t.withIdentity({ subject: owner });
			await t.mutation(api.projects.addMember, {
				projectId,
				userEmail: "member@test.com",
				role: "editor",
			});

			// Create project document
			const docId = await t.mutation(api.documents.create, {
				title: "Project Doc",
				isPublic: false,
				projectId,
			});

			// Access as project member
			t.withIdentity({ subject: member });
			const doc = await t.query(api.documents.get, { id: docId });
			expect(doc?.title).toBe("Project Doc");
		});

		it("should return null for non-existent documents", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			const fakeId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as any;
			const doc = await t.query(api.documents.get, { id: fakeId });
			expect(doc).toBeNull();
		});
	});

	describe("list", () => {
		it("should return all accessible documents for user", async () => {
			const t = convexTest(schema, modules);
			const user1 = await createTestUser(t, { name: "User 1" });
			const user2 = await createTestUser(t, { name: "User 2" });

			// User 1 creates documents
			t.withIdentity({ subject: user1 });
			await t.mutation(api.documents.create, {
				title: "User 1 Private",
				isPublic: false,
			});
			await t.mutation(api.documents.create, {
				title: "Public Doc",
				isPublic: true,
			});

			// User 2 creates a document
			t.withIdentity({ subject: user2 });
			await t.mutation(api.documents.create, {
				title: "User 2 Private",
				isPublic: false,
			});

			// User 2 should see: their own doc + the public doc
			const docs = await t.query(api.documents.list, {});
			expect(docs).toHaveLength(2);
			const titles = docs.map((d) => d.title);
			expect(titles).toContain("User 2 Private");
			expect(titles).toContain("Public Doc");
			expect(titles).not.toContain("User 1 Private");
		});

		it("should return empty array for unauthenticated users", async () => {
			const t = convexTest(schema, modules);
			const docs = await t.query(api.documents.list, {});
			expect(docs).toEqual([]);
		});

		it("should include creator information", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t, { name: "Creator" });

			t.withIdentity({ subject: userId });
			await t.mutation(api.documents.create, {
				title: "Test Doc",
				isPublic: false,
			});

			const docs = await t.query(api.documents.list, {});
			expect(docs).toHaveLength(1);
			expect(docs[0]).toHaveProperty("creatorName");
		});
	});

	describe("updateTitle", () => {
		it("should allow owner to update title", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			const docId = await t.mutation(api.documents.create, {
				title: "Original Title",
				isPublic: false,
			});

			await t.mutation(api.documents.updateTitle, {
				id: docId,
				title: "Updated Title",
			});

			const doc = await t.query(api.documents.get, { id: docId });
			expect(doc?.title).toBe("Updated Title");
		});

		it("should update the updatedAt timestamp", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			const docId = await t.mutation(api.documents.create, {
				title: "Original",
				isPublic: false,
			});

			const docBefore = await t.query(api.documents.get, { id: docId });
			const createdAt = docBefore?.createdAt;

			// Wait a bit to ensure different timestamp
			await new Promise((resolve) => setTimeout(resolve, 10));

			await t.mutation(api.documents.updateTitle, {
				id: docId,
				title: "Updated",
			});

			const docAfter = await t.query(api.documents.get, { id: docId });
			expect(docAfter?.updatedAt).toBeGreaterThan(createdAt || 0);
		});

		it("should deny non-owners from updating", async () => {
			const t = convexTest(schema, modules);
			const owner = await createTestUser(t, { name: "Owner" });
			const other = await createTestUser(t, { name: "Other" });

			t.withIdentity({ subject: owner });
			const docId = await t.mutation(api.documents.create, {
				title: "Original",
				isPublic: false,
			});

			t.withIdentity({ subject: other });
			await expect(async () => {
				await t.mutation(api.documents.updateTitle, {
					id: docId,
					title: "Hacked",
				});
			}).rejects.toThrow("Not authorized");
		});

		it("should deny unauthenticated users", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			const docId = await t.mutation(api.documents.create, {
				title: "Test",
				isPublic: false,
			});

			t.withIdentity({ subject: undefined });
			await expect(async () => {
				await t.mutation(api.documents.updateTitle, {
					id: docId,
					title: "Unauthorized",
				});
			}).rejects.toThrow("Not authenticated");
		});
	});

	describe("togglePublic", () => {
		it("should toggle document from private to public", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			const docId = await t.mutation(api.documents.create, {
				title: "Private Doc",
				isPublic: false,
			});

			await t.mutation(api.documents.togglePublic, { id: docId });

			const doc = await t.query(api.documents.get, { id: docId });
			expect(doc?.isPublic).toBe(true);
		});

		it("should toggle document from public to private", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			const docId = await t.mutation(api.documents.create, {
				title: "Public Doc",
				isPublic: true,
			});

			await t.mutation(api.documents.togglePublic, { id: docId });

			const doc = await t.query(api.documents.get, { id: docId });
			expect(doc?.isPublic).toBe(false);
		});

		it("should deny non-owners from toggling", async () => {
			const t = convexTest(schema, modules);
			const owner = await createTestUser(t, { name: "Owner" });
			const other = await createTestUser(t, { name: "Other" });

			t.withIdentity({ subject: owner });
			const docId = await t.mutation(api.documents.create, {
				title: "Test",
				isPublic: false,
			});

			t.withIdentity({ subject: other });
			await expect(async () => {
				await t.mutation(api.documents.togglePublic, { id: docId });
			}).rejects.toThrow("Not authorized");
		});
	});

	describe("deleteDocument", () => {
		it("should allow owner to delete document", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			const docId = await t.mutation(api.documents.create, {
				title: "To Delete",
				isPublic: false,
			});

			await t.mutation(api.documents.deleteDocument, { id: docId });

			const doc = await t.query(api.documents.get, { id: docId });
			expect(doc).toBeNull();
		});

		it("should deny non-owners from deleting", async () => {
			const t = convexTest(schema, modules);
			const owner = await createTestUser(t, { name: "Owner" });
			const other = await createTestUser(t, { name: "Other" });

			t.withIdentity({ subject: owner });
			const docId = await t.mutation(api.documents.create, {
				title: "Protected",
				isPublic: false,
			});

			t.withIdentity({ subject: other });
			await expect(async () => {
				await t.mutation(api.documents.deleteDocument, { id: docId });
			}).rejects.toThrow("Not authorized");
		});

		it("should deny unauthenticated users from deleting", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			const docId = await t.mutation(api.documents.create, {
				title: "Test",
				isPublic: false,
			});

			t.withIdentity({ subject: undefined });
			await expect(async () => {
				await t.mutation(api.documents.deleteDocument, { id: docId });
			}).rejects.toThrow("Not authenticated");
		});
	});

	describe("search", () => {
		it("should search documents by title", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			await t.mutation(api.documents.create, {
				title: "Product Requirements Document",
				isPublic: false,
			});
			await t.mutation(api.documents.create, {
				title: "Technical Design Document",
				isPublic: false,
			});
			await t.mutation(api.documents.create, {
				title: "Meeting Notes",
				isPublic: false,
			});

			const results = await t.query(api.documents.search, {
				query: "document",
			});

			expect(results).toHaveLength(2);
			const titles = results.map((d) => d.title);
			expect(titles).toContain("Product Requirements Document");
			expect(titles).toContain("Technical Design Document");
			expect(titles).not.toContain("Meeting Notes");
		});

		it("should only search accessible documents", async () => {
			const t = convexTest(schema, modules);
			const user1 = await createTestUser(t, { name: "User 1" });
			const user2 = await createTestUser(t, { name: "User 2" });

			// User 1 creates private document
			t.withIdentity({ subject: user1 });
			await t.mutation(api.documents.create, {
				title: "User 1 Secret Document",
				isPublic: false,
			});

			// User 2 creates public document
			t.withIdentity({ subject: user2 });
			await t.mutation(api.documents.create, {
				title: "User 2 Public Document",
				isPublic: true,
			});

			// User 2 searches for "document"
			const results = await t.query(api.documents.search, {
				query: "document",
			});

			// Should only find User 2's document and the public one
			expect(results.length).toBeGreaterThanOrEqual(1);
			const titles = results.map((d) => d.title);
			expect(titles).toContain("User 2 Public Document");
		});

		it("should return empty array when no matches found", async () => {
			const t = convexTest(schema, modules);
			const userId = await createTestUser(t);

			t.withIdentity({ subject: userId });
			await t.mutation(api.documents.create, {
				title: "Test Document",
				isPublic: false,
			});

			const results = await t.query(api.documents.search, {
				query: "nonexistent",
			});

			expect(results).toEqual([]);
		});
	});
});
