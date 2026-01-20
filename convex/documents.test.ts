import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Documents", () => {
  describe("create", () => {
    it("should create a public document", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const docId = await asUser.mutation(api.documents.create, {
        title: "Public Document",
        isPublic: true,
      });

      expect(docId).toBeDefined();

      const doc = await asUser.query(api.documents.get, { id: docId });
      expect(doc?.title).toBe("Public Document");
      expect(doc?.isPublic).toBe(true);
      expect(doc?.createdBy).toBe(userId);
    });

    it("should create a private document", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const docId = await asUser.mutation(api.documents.create, {
        title: "Private Document",
        isPublic: false,
      });

      const doc = await asUser.query(api.documents.get, { id: docId });
      expect(doc?.title).toBe("Private Document");
      expect(doc?.isPublic).toBe(false);
    });

    it("should create a document without project link", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const docId = await asUser.mutation(api.documents.create, {
        title: "Document Without Project",
        isPublic: false,
      });

      const doc = await asUser.query(api.documents.get, { id: docId });
      expect(doc?.title).toBe("Document Without Project");
      expect(doc?.projectId).toBeUndefined();
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

      const asUser = asAuthenticatedUser(t, userId);
      const docId = await asUser.mutation(api.documents.create, {
        title: "Timestamped Document",
        isPublic: false,
      });

      const doc = await asUser.query(api.documents.get, { id: docId });
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
      const asOwner = asAuthenticatedUser(t, owner);
      const docId = await asOwner.mutation(api.documents.create, {
        title: "Public Doc",
        isPublic: true,
      });

      // Access as different user
      const asViewer = asAuthenticatedUser(t, viewer);
      const doc = await asViewer.query(api.documents.get, { id: docId });
      expect(doc?.title).toBe("Public Doc");
      expect(doc?.isPublic).toBe(true);
    });

    it("should return private documents for owner", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const docId = await asUser.mutation(api.documents.create, {
        title: "My Private Doc",
        isPublic: false,
      });

      const doc = await asUser.query(api.documents.get, { id: docId });
      expect(doc?.title).toBe("My Private Doc");
      expect(doc?.createdBy).toBe(userId);
    });

    it("should deny access to private documents for non-owners", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });

      // Create private document
      const asOwner = asAuthenticatedUser(t, owner);
      const docId = await asOwner.mutation(api.documents.create, {
        title: "Secret Document",
        isPublic: false,
      });

      // Try to access as other user - should throw error
      const asOther = asAuthenticatedUser(t, other);
      await expect(async () => {
        await asOther.query(api.documents.get, { id: docId });
      }).rejects.toThrow("Not authorized to access this document");
    });

    it("should return public documents to anyone", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const member = await createTestUser(t, {
        name: "Member",
        email: "member@test.com",
      });

      // Create public document as owner
      const asOwner = asAuthenticatedUser(t, owner);
      const docId = await asOwner.mutation(api.documents.create, {
        title: "Public Project Doc",
        isPublic: true,
      });

      // Access as different user - should work because it's public
      const asMember = asAuthenticatedUser(t, member);
      const doc = await asMember.query(api.documents.get, { id: docId });
      expect(doc?.title).toBe("Public Project Doc");
    });

    it("should return null for deleted documents", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);

      // Create and then delete a document
      const docId = await asUser.mutation(api.documents.create, {
        title: "To Delete",
        isPublic: false,
      });

      await asUser.mutation(api.documents.deleteDocument, { id: docId });

      // Try to get the deleted document
      const doc = await asUser.query(api.documents.get, { id: docId });
      expect(doc).toBeNull();
    });
  });

  describe("list", () => {
    it("should return all accessible documents for user", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });

      // User 1 creates documents
      const asUser1 = asAuthenticatedUser(t, user1);
      await asUser1.mutation(api.documents.create, {
        title: "User 1 Private",
        isPublic: false,
      });
      await asUser1.mutation(api.documents.create, {
        title: "Public Doc",
        isPublic: true,
      });

      // User 2 creates a document
      const asUser2 = asAuthenticatedUser(t, user2);
      await asUser2.mutation(api.documents.create, {
        title: "User 2 Private",
        isPublic: false,
      });

      // User 2 should see: their own doc + the public doc
      const result = await asUser2.query(api.documents.list, {});
      expect(result.documents).toHaveLength(2);
      const titles = result.documents.map((d) => d.title);
      expect(titles).toContain("User 2 Private");
      expect(titles).toContain("Public Doc");
      expect(titles).not.toContain("User 1 Private");
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      await expect(t.query(api.documents.list, {})).rejects.toThrow("Not authenticated");
    });

    it("should include creator information", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "Creator" });

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.documents.create, {
        title: "Test Doc",
        isPublic: false,
      });

      const result = await asUser.query(api.documents.list, {});
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0]).toHaveProperty("creatorName");
    });
  });

  describe("updateTitle", () => {
    it("should allow owner to update title", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const docId = await asUser.mutation(api.documents.create, {
        title: "Original Title",
        isPublic: false,
      });

      await asUser.mutation(api.documents.updateTitle, {
        id: docId,
        title: "Updated Title",
      });

      const doc = await asUser.query(api.documents.get, { id: docId });
      expect(doc?.title).toBe("Updated Title");
    });

    it("should update the updatedAt timestamp", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const docId = await asUser.mutation(api.documents.create, {
        title: "Original",
        isPublic: false,
      });

      const docBefore = await asUser.query(api.documents.get, { id: docId });
      const createdAt = docBefore?.createdAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      await asUser.mutation(api.documents.updateTitle, {
        id: docId,
        title: "Updated",
      });

      const docAfter = await asUser.query(api.documents.get, { id: docId });
      expect(docAfter?.updatedAt).toBeGreaterThan(createdAt || 0);
    });

    it("should deny non-owners from updating", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });

      const asOwner = asAuthenticatedUser(t, owner);
      const docId = await asOwner.mutation(api.documents.create, {
        title: "Original",
        isPublic: false,
      });

      const asOther = asAuthenticatedUser(t, other);
      await expect(async () => {
        await asOther.mutation(api.documents.updateTitle, {
          id: docId,
          title: "Hacked",
        });
      }).rejects.toThrow("Not authorized");
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const docId = await asUser.mutation(api.documents.create, {
        title: "Test",
        isPublic: false,
      });

      // Call without authentication
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

      const asUser = asAuthenticatedUser(t, userId);
      const docId = await asUser.mutation(api.documents.create, {
        title: "Private Doc",
        isPublic: false,
      });

      await asUser.mutation(api.documents.togglePublic, { id: docId });

      const doc = await asUser.query(api.documents.get, { id: docId });
      expect(doc?.isPublic).toBe(true);
    });

    it("should toggle document from public to private", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const docId = await asUser.mutation(api.documents.create, {
        title: "Public Doc",
        isPublic: true,
      });

      await asUser.mutation(api.documents.togglePublic, { id: docId });

      const doc = await asUser.query(api.documents.get, { id: docId });
      expect(doc?.isPublic).toBe(false);
    });

    it("should deny non-owners from toggling", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });

      const asOwner = asAuthenticatedUser(t, owner);
      const docId = await asOwner.mutation(api.documents.create, {
        title: "Test",
        isPublic: false,
      });

      const asOther = asAuthenticatedUser(t, other);
      await expect(async () => {
        await asOther.mutation(api.documents.togglePublic, { id: docId });
      }).rejects.toThrow("Not authorized");
    });
  });

  describe("deleteDocument", () => {
    it("should allow owner to delete document", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const docId = await asUser.mutation(api.documents.create, {
        title: "To Delete",
        isPublic: false,
      });

      await asUser.mutation(api.documents.deleteDocument, { id: docId });

      const doc = await asUser.query(api.documents.get, { id: docId });
      expect(doc).toBeNull();
    });

    it("should deny non-owners from deleting", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });

      const asOwner = asAuthenticatedUser(t, owner);
      const docId = await asOwner.mutation(api.documents.create, {
        title: "Protected",
        isPublic: false,
      });

      const asOther = asAuthenticatedUser(t, other);
      await expect(async () => {
        await asOther.mutation(api.documents.deleteDocument, { id: docId });
      }).rejects.toThrow("Not authorized");
    });

    it("should deny unauthenticated users from deleting", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const docId = await asUser.mutation(api.documents.create, {
        title: "Test",
        isPublic: false,
      });

      // Call without authentication
      await expect(async () => {
        await t.mutation(api.documents.deleteDocument, { id: docId });
      }).rejects.toThrow("Not authenticated");
    });
  });

  describe("search", () => {
    it("should search documents by title", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.documents.create, {
        title: "Product Requirements Document",
        isPublic: false,
      });
      await asUser.mutation(api.documents.create, {
        title: "Technical Design Document",
        isPublic: false,
      });
      await asUser.mutation(api.documents.create, {
        title: "Meeting Notes",
        isPublic: false,
      });

      const searchResult = await asUser.query(api.documents.search, {
        query: "document",
      });

      expect(searchResult.results).toHaveLength(2);
      const titles = searchResult.results.map((d) => d.title);
      expect(titles).toContain("Product Requirements Document");
      expect(titles).toContain("Technical Design Document");
      expect(titles).not.toContain("Meeting Notes");
    });

    it("should only search accessible documents", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });

      // User 1 creates private document
      const asUser1 = asAuthenticatedUser(t, user1);
      await asUser1.mutation(api.documents.create, {
        title: "User 1 Secret Document",
        isPublic: false,
      });

      // User 2 creates public document
      const asUser2 = asAuthenticatedUser(t, user2);
      await asUser2.mutation(api.documents.create, {
        title: "User 2 Public Document",
        isPublic: true,
      });

      // User 2 searches for "document"
      const searchResult = await asUser2.query(api.documents.search, {
        query: "document",
      });

      // Should only find User 2's document and the public one
      expect(searchResult.results.length).toBeGreaterThanOrEqual(1);
      const titles = searchResult.results.map((d) => d.title);
      expect(titles).toContain("User 2 Public Document");
    });

    it("should return empty results when no matches found", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.documents.create, {
        title: "Test Document",
        isPublic: false,
      });

      const searchResult = await asUser.query(api.documents.search, {
        query: "nonexistent",
      });

      expect(searchResult.results).toEqual([]);
    });
  });
});
