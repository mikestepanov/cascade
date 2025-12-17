/**
 * Migration script: Add Workspace/Team Hierarchy
 * 
 * This migration creates the workspace/team hierarchy for existing data:
 * 1. Create a default "General" workspace for each company
 * 2. Create a default "General Team" in each workspace
 * 3. Assign all existing projects to the general team
 * 4. Update all issues with workspaceId and teamId
 * 
 * Run with:
 * - Check status: npx convex run migrations/addWorkspaceTeamHierarchy:checkStatus
 * - Run migration: npx convex run migrations/addWorkspaceTeamHierarchy:migrate
 */

import { internalMutation, query } from "../_generated/server";
import { v } from "convex/values";

// Check migration status
export const checkStatus = query({
  args: {},
  handler: async (ctx) => {
    // Count companies
    const companies = await ctx.db.query("companies").collect();
    
    // Count workspaces
    const workspaces = await ctx.db.query("workspaces").collect();
    
    // Count teams
    const teams = await ctx.db.query("teams").collect();
    
    // Count projects without workspaceId or teamId
    const projects = await ctx.db.query("projects").collect();
    const projectsNeedingMigration = projects.filter(
      (p) => !p.workspaceId || !p.teamId
    );
    
    // Count issues without workspaceId or teamId
    const issues = await ctx.db.query("issues").collect();
    const issuesNeedingMigration = issues.filter(
      (i) => !i.workspaceId || !i.teamId
    );

    const needsMigration = 
      projectsNeedingMigration.length > 0 || 
      issuesNeedingMigration.length > 0;

    return {
      companies: companies.length,
      workspaces: workspaces.length,
      teams: teams.length,
      projects: {
        total: projects.length,
        needsMigration: projectsNeedingMigration.length,
      },
      issues: {
        total: issues.length,
        needsMigration: issuesNeedingMigration.length,
      },
      needsMigration,
      message: needsMigration
        ? `Migration needed: ${projectsNeedingMigration.length} projects and ${issuesNeedingMigration.length} issues need workspace/team assignment`
        : "All clean! No migration needed",
    };
  },
});

// Run the migration
export const migrate = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      companiesProcessed: 0,
      workspacesCreated: 0,
      teamsCreated: 0,
      projectsUpdated: 0,
      issuesUpdated: 0,
      errors: [] as string[],
    };

    // Get all companies
    const companies = await ctx.db.query("companies").collect();

    // Step 1: Create workspace + team for each company
    for (const company of companies) {
      try {
        results.companiesProcessed++;

        // Find or create default workspace for this company
        let workspace = await ctx.db
          .query("workspaces")
          .withIndex("by_company_slug", (q) =>
            q.eq("companyId", company._id).eq("slug", "general")
          )
          .first();

        if (!workspace) {
          const workspaceId = await ctx.db.insert("workspaces", {
            name: "General",
            slug: "general",
            companyId: company._id,
            createdBy: company.createdBy,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          workspace = await ctx.db.get(workspaceId);
          results.workspacesCreated++;
        }

        if (!workspace) {
          results.errors.push(`Failed to create/get workspace for company ${company.name}`);
          continue;
        }

        // Find or create default team in this workspace
        let team = await ctx.db
          .query("teams")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
          .filter((q) => q.eq(q.field("slug"), "general-team"))
          .first();

        if (!team) {
          const teamId = await ctx.db.insert("teams", {
            name: "General Team",
            slug: "general-team",
            workspaceId: workspace._id,
            companyId: company._id,
            isPrivate: false,
            createdBy: company.createdBy,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          team = await ctx.db.get(teamId);
          results.teamsCreated++;
        }
      } catch (error) {
        results.errors.push(
          `Error processing company ${company.name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Step 2: Update ALL projects (regardless of company) to use first workspace/team they find
    const allProjects = await ctx.db.query("projects").collect();
    for (const project of allProjects) {
      try {
        // Only update if missing workspaceId or teamId
        if (!project.workspaceId || !project.teamId) {
          // Find company's workspace/team
          const companyId = project.companyId;
          if (!companyId) {
            results.errors.push(`Project ${project.name} has no companyId`);
            continue;
          }

          const workspace = await ctx.db
            .query("workspaces")
            .withIndex("by_company_slug", (q) =>
              q.eq("companyId", companyId).eq("slug", "general")
            )
            .first();

          const team = workspace
            ? await ctx.db
                .query("teams")
                .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
                .first()
            : null;

          if (workspace && team) {
            await ctx.db.patch(project._id, {
              workspaceId: workspace._id,
              teamId: team._id,
            });
            results.projectsUpdated++;
          }
        }
      } catch (error) {
        results.errors.push(
          `Error updating project ${project.name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Step 3: Update ALL issues to match their project's workspace/team
    const allIssues = await ctx.db.query("issues").collect();
    for (const issue of allIssues) {
      try {
        // Only update if missing workspaceId or teamId
        if (!issue.workspaceId || !issue.teamId) {
          const project = issue.projectId
            ? await ctx.db.get(issue.projectId)
            : null;

          if (project && project.workspaceId && project.teamId) {
            await ctx.db.patch(issue._id, {
              workspaceId: project.workspaceId,
              teamId: project.teamId,
            });
            results.issuesUpdated++;
          }
        }
      } catch (error) {
        results.errors.push(
          `Error updating issue ${issue.key}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return {
      ...results,
      success: results.errors.length === 0,
      message:
        results.errors.length === 0
          ? `Migration complete! Created ${results.workspacesCreated} workspaces, ${results.teamsCreated} teams, updated ${results.projectsUpdated} projects and ${results.issuesUpdated} issues.`
          : `Migration completed with ${results.errors.length} errors. Check results.`,
    };
  },
});

// Rollback migration (removes workspace/team assignments)
export const rollback = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      projectsCleared: 0,
      issuesCleared: 0,
      workspacesDeleted: 0,
      teamsDeleted: 0,
      errors: [] as string[],
    };

    try {
      // Clear workspace/team from all projects
      const projects = await ctx.db.query("projects").collect();
      for (const project of projects) {
        if (project.workspaceId || project.teamId) {
          await ctx.db.patch(project._id, {
            workspaceId: undefined,
            teamId: undefined,
          });
          results.projectsCleared++;
        }
      }

      // Clear workspace/team from all issues
      const issues = await ctx.db.query("issues").collect();
      for (const issue of issues) {
        if (issue.workspaceId || issue.teamId) {
          await ctx.db.patch(issue._id, {
            workspaceId: undefined,
            teamId: undefined,
          });
          results.issuesCleared++;
        }
      }

      // Delete all workspaces (optional - comment out if you want to keep them)
      const workspaces = await ctx.db.query("workspaces").collect();
      for (const workspace of workspaces) {
        await ctx.db.delete(workspace._id);
        results.workspacesDeleted++;
      }

      // Delete all teams (optional - comment out if you want to keep them)
      const teams = await ctx.db.query("teams").collect();
      for (const team of teams) {
        await ctx.db.delete(team._id);
        results.teamsDeleted++;
      }
    } catch (error) {
      results.errors.push(
        `Rollback error: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return {
      ...results,
      success: results.errors.length === 0,
      message:
        results.errors.length === 0
          ? `Rollback complete! Cleared ${results.projectsCleared} projects, ${results.issuesCleared} issues, deleted ${results.workspacesDeleted} workspaces and ${results.teamsDeleted} teams.`
          : `Rollback completed with errors.`,
    };
  },
});
