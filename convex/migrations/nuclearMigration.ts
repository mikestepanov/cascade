/**
 * NUCLEAR MIGRATION: Assign all orphaned data to first available workspace/team
 * 
 * This is a simple "nuke" approach that:
 * 1. Finds ANY workspace + team
 * 2. Assigns ALL projects without workspace/team to it
 * 3. Assigns ALL issues without workspace/team to their project's workspace/team
 * 
 * Run with: npx convex run migrations/nuclearMigration:nuke
 */

import { internalMutation } from "../_generated/server";

export const nuke = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      projectsUpdated: 0,
      issuesUpdated: 0,
      errors: [] as string[],
    };

    // Get ANY workspace and team (just use the first ones)
    const firstWorkspace = await ctx.db.query("workspaces").first();
    const firstTeam = await ctx.db.query("teams").first();

    if (!firstWorkspace || !firstTeam) {
      return {
        ...results,
        success: false,
        message: "No workspace or team found! Run the main migration first.",
      };
    }

    console.log(`Using workspace: ${firstWorkspace.name}, team: ${firstTeam.name}`);

    // Update ALL projects without workspace/team
    const allProjects = await ctx.db.query("projects").collect();
    for (const project of allProjects) {
      if (!project.workspaceId || !project.teamId) {
        await ctx.db.patch(project._id, {
          workspaceId: firstWorkspace._id,
          teamId: firstTeam._id,
        });
        results.projectsUpdated++;
        console.log(`Updated project: ${project.name}`);
      }
    }

    // Update ALL issues to match their project's workspace/team
    const allIssues = await ctx.db.query("issues").collect();
    for (const issue of allIssues) {
      if (!issue.workspaceId || !issue.teamId) {
        const project = issue.projectId ? await ctx.db.get(issue.projectId) : null;

        if (project && project.workspaceId && project.teamId) {
          await ctx.db.patch(issue._id, {
            workspaceId: project.workspaceId,
            teamId: project.teamId,
          });
          results.issuesUpdated++;
          console.log(`Updated issue: ${issue.key}`);
        } else {
          // If project doesn't have workspace/team, just use the first ones
          await ctx.db.patch(issue._id, {
            workspaceId: firstWorkspace._id,
            teamId: firstTeam._id,
          });
          results.issuesUpdated++;
          console.log(`Updated orphaned issue: ${issue.key}`);
        }
      }
    }

    return {
      ...results,
      success: true,
      message: `NUKE complete! Updated ${results.projectsUpdated} projects and ${results.issuesUpdated} issues.`,
    };
  },
});
