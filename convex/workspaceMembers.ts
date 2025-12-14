import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { assertCanAccessProject } from "./workspaceAccess";

// List all members of a project with user details
export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user has access to project
    await assertCanAccessProject(ctx, args.workspaceId, userId);

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Fetch user details for each member, filter out members with deleted users
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        if (!user) return null; // User was deleted

        return {
          ...member,
          userName: user.name ?? user.email ?? "Unknown User",
          userEmail: user.email,
          userImage: user.image,
        };
      }),
    );

    // Filter out null entries (deleted users)
    return membersWithDetails.filter((m) => m !== null);
  },
});
