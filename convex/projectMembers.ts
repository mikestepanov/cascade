import { v } from "convex/values";
import { authenticatedQuery } from "./customFunctions";
import { notDeleted } from "./lib/softDeleteHelpers";
import { assertCanAccessProject } from "./projectAccess";

// List all members of a project with user details
export const list = authenticatedQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Check if user has access to project
    await assertCanAccessProject(ctx, args.projectId, ctx.userId);

    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter(notDeleted)
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
