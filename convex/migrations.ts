import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const deleteInvalidInvites = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Collect all invites - we can't filter by missing field easily in query
    const invites = await ctx.db.query("invites").collect();
    let deletedCount = 0;

    for (const invite of invites) {
      if (!invite.companyId) {
        await ctx.db.delete(invite._id);
        deletedCount++;
      }
    }

    return `Deleted ${deletedCount} invalid invites missing companyId.`;
  },
});
