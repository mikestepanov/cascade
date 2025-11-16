import { getAuthUserId } from "@convex-dev/auth/server";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { components } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

async function checkPermissions(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  documentId: string,
) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const document = await ctx.db.get(documentId as Id<"documents">);
  if (!document) {
    throw new Error("Document not found");
  }

  // Check if user can access this document
  if (!("isPublic" in document) || !("createdBy" in document)) {
    throw new Error("Invalid document");
  }

  if (!document.isPublic && document.createdBy !== userId) {
    throw new Error("Not authorized to access this document");
  }
}

async function checkWritePermissions(ctx: GenericMutationCtx<DataModel>, documentId: string) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const document = await ctx.db.get(documentId as Id<"documents">);
  if (!document) {
    throw new Error("Document not found");
  }

  // Check if user can write to this document
  if (!("isPublic" in document) || !("createdBy" in document)) {
    throw new Error("Invalid document");
  }

  // Only allow writes to public documents or documents owned by the user
  if (!document.isPublic && document.createdBy !== userId) {
    throw new Error("Not authorized to edit this document");
  }
}

export const { getSnapshot, submitSnapshot, latestVersion, getSteps, submitSteps } =
  prosemirrorSync.syncApi<DataModel>({
    checkRead: checkPermissions,
    checkWrite: checkWritePermissions,
    onSnapshot: async (ctx, id, _snapshot, _version) => {
      // Update the document's updatedAt timestamp when content changes
      const document = await ctx.db.get(id as Id<"documents">);
      if (document) {
        await ctx.db.patch(id as Id<"documents">, {
          updatedAt: Date.now(),
        });
      }
    },
  });
