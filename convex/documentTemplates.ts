import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Create a document template
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    icon: v.string(),
    content: v.any(), // BlockNote/ProseMirror content structure
    isPublic: v.boolean(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const templateId = await ctx.db.insert("documentTemplates", {
      name: args.name,
      description: args.description,
      category: args.category,
      icon: args.icon,
      content: args.content,
      isBuiltIn: false,
      isPublic: args.isPublic,
      createdBy: userId,
      projectId: args.projectId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return templateId;
  },
});

// List all available templates (built-in + user's templates + public templates)
export const list = query({
  args: {
    category: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let templates: Array<Doc<"documentTemplates">>;

    if (args.category) {
      const category = args.category; // Store in variable for type narrowing
      templates = await ctx.db
        .query("documentTemplates")
        .withIndex("by_category", (q) => q.eq("category", category))
        .collect();
    } else {
      templates = await ctx.db.query("documentTemplates").collect();
    }

    // Filter to show:
    // 1. Built-in templates
    // 2. Public templates
    // 3. User's own templates
    // 4. Project-specific templates (if projectId provided)
    const filtered = templates.filter((t) => {
      if (t.isBuiltIn) return true;
      if (t.isPublic) return true;
      if (t.createdBy === userId) return true;
      if (args.projectId && t.projectId === args.projectId) return true;
      return false;
    });

    return filtered;
  },
});

// Get a single template
export const get = query({
  args: { id: v.id("documentTemplates") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const template = await ctx.db.get(args.id);
    if (!template) return null;

    // Check if user has access to this template
    if (
      !template.isBuiltIn &&
      !template.isPublic &&
      template.createdBy !== userId &&
      !template.projectId
    ) {
      throw new Error("No access to this template");
    }

    return template;
  },
});

// Update a template
export const update = mutation({
  args: {
    id: v.id("documentTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    icon: v.optional(v.string()),
    content: v.optional(v.any()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const template = await ctx.db.get(args.id);
    if (!template) throw new Error("Template not found");

    // Only creator can update their templates (built-in templates can't be updated)
    if (template.isBuiltIn) {
      throw new Error("Cannot update built-in templates");
    }
    if (template.createdBy !== userId) {
      throw new Error("Not authorized to update this template");
    }

    const updates: Partial<typeof template> = {
      updatedAt: Date.now(),
    };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.category !== undefined) updates.category = args.category;
    if (args.icon !== undefined) updates.icon = args.icon;
    if (args.content !== undefined) updates.content = args.content;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;

    await ctx.db.patch(args.id, updates);
  },
});

// Delete a template
export const remove = mutation({
  args: { id: v.id("documentTemplates") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const template = await ctx.db.get(args.id);
    if (!template) throw new Error("Template not found");

    // Only creator can delete their templates (built-in templates can't be deleted)
    if (template.isBuiltIn) {
      throw new Error("Cannot delete built-in templates");
    }
    if (template.createdBy !== userId) {
      throw new Error("Not authorized to delete this template");
    }

    await ctx.db.delete(args.id);
  },
});

// Create a document from a template
export const createDocumentFromTemplate = mutation({
  args: {
    templateId: v.id("documentTemplates"),
    title: v.string(),
    projectId: v.optional(v.id("projects")),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    // Check if user has access to this template
    if (
      !template.isBuiltIn &&
      !template.isPublic &&
      template.createdBy !== userId &&
      !template.projectId
    ) {
      throw new Error("No access to this template");
    }

    // Create document
    const documentId = await ctx.db.insert("documents", {
      title: args.title,
      isPublic: args.isPublic,
      createdBy: userId,
      projectId: args.projectId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Note: The template content will be applied when the editor initializes
    // The caller should use the template.content to initialize the BlockNote editor

    return { documentId, templateContent: template.content };
  },
});

// Initialize built-in templates (run once on deployment)
export const initializeBuiltInTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if built-in templates already exist
    const existing = await ctx.db
      .query("documentTemplates")
      .withIndex("by_built_in", (q) => q.eq("isBuiltIn", true))
      .first();

    if (existing) {
      return { message: "Built-in templates already exist" };
    }

    const now = Date.now();
    const builtInTemplates = [
      {
        name: "Meeting Notes",
        description: "Template for team meeting notes with agenda and action items",
        category: "meeting",
        icon: "📝",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Meeting Notes" }],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Meeting Details" }],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Date: " },
                { type: "text", text: "[Date]" },
              ],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Attendees: " },
                { type: "text", text: "[Names]" },
              ],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Agenda" }],
            },
            {
              type: "bulletListItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Topic 1" }] },
              ],
            },
            {
              type: "bulletListItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Topic 2" }] },
              ],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Discussion" }],
            },
            { type: "paragraph", content: [{ type: "text", text: "" }] },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Action Items" }],
            },
            {
              type: "checkListItem",
              attrs: { checked: false },
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Action item 1" }] },
              ],
            },
            {
              type: "checkListItem",
              attrs: { checked: false },
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Action item 2" }] },
              ],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Next Steps" }],
            },
            { type: "paragraph", content: [{ type: "text", text: "" }] },
          ],
        },
        isBuiltIn: true,
        isPublic: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "RFC (Request for Comments)",
        description: "Template for technical design documents and proposals",
        category: "engineering",
        icon: "📋",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "RFC: [Title]" }],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Status: " },
                { type: "text", text: "Draft" },
              ],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Author: " },
                { type: "text", text: "[Your Name]" },
              ],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Date: " },
                { type: "text", text: "[Date]" },
              ],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Summary" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Brief overview of the proposal..." }],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Motivation" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Why are we doing this? What problem does it solve?" }],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Proposed Solution" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Detailed explanation of the proposed solution..." }],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Alternatives Considered" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Other approaches we considered and why we didn't choose them..." }],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Implementation Plan" }],
            },
            {
              type: "numberedListItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Phase 1: ..." }] },
              ],
            },
            {
              type: "numberedListItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Phase 2: ..." }] },
              ],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Open Questions" }],
            },
            {
              type: "bulletListItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Question 1?" }] },
              ],
            },
          ],
        },
        isBuiltIn: true,
        isPublic: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Project Brief",
        description: "Template for project kickoff and planning documents",
        category: "planning",
        icon: "🎯",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Project Brief: [Project Name]" }],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Project Overview" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "High-level description of the project..." }],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Objectives" }],
            },
            {
              type: "bulletListItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Objective 1" }] },
              ],
            },
            {
              type: "bulletListItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Objective 2" }] },
              ],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Success Criteria" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "How will we measure success?" }],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Scope" }],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "In Scope:" },
              ],
            },
            {
              type: "bulletListItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Item 1" }] },
              ],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Out of Scope:" },
              ],
            },
            {
              type: "bulletListItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Item 1" }] },
              ],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Timeline" }],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Start Date: " },
                { type: "text", text: "[Date]" },
              ],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Target Completion: " },
                { type: "text", text: "[Date]" },
              ],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Team" }],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Project Lead: " },
                { type: "text", text: "[Name]" },
              ],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Team Members: " },
                { type: "text", text: "[Names]" },
              ],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Risks & Mitigation" }],
            },
            { type: "paragraph", content: [{ type: "text", text: "" }] },
          ],
        },
        isBuiltIn: true,
        isPublic: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Post-Mortem",
        description: "Template for incident post-mortem analysis",
        category: "engineering",
        icon: "🔍",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Post-Mortem: [Incident Name]" }],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Date: " },
                { type: "text", text: "[Date]" },
              ],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Author: " },
                { type: "text", text: "[Name]" },
              ],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Summary" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Brief description of what happened..." }],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Impact" }],
            },
            {
              type: "bulletListItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Users affected: " }] },
              ],
            },
            {
              type: "bulletListItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Duration: " }] },
              ],
            },
            {
              type: "bulletListItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Services affected: " }] },
              ],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Timeline" }],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "HH:MM - " },
                { type: "text", text: "Event description" },
              ],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Root Cause" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "What was the underlying cause of the incident?" }],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Resolution" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "How was the incident resolved?" }],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Action Items" }],
            },
            {
              type: "checkListItem",
              attrs: { checked: false },
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Action item 1 - [Owner]" }] },
              ],
            },
            {
              type: "checkListItem",
              attrs: { checked: false },
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Action item 2 - [Owner]" }] },
              ],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Lessons Learned" }],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "What went well:" },
              ],
            },
            {
              type: "bulletListItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "..." }] },
              ],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "What could be improved:" },
              ],
            },
            {
              type: "bulletListItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "..." }] },
              ],
            },
          ],
        },
        isBuiltIn: true,
        isPublic: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "1:1 Meeting Template",
        description: "Template for one-on-one meetings between managers and team members",
        category: "meeting",
        icon: "👥",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "1:1 Meeting" }],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Date: " },
                { type: "text", text: "[Date]" },
              ],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Participants: " },
                { type: "text", text: "[Names]" },
              ],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Updates & Progress" }],
            },
            { type: "paragraph", content: [{ type: "text", text: "" }] },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Challenges & Blockers" }],
            },
            { type: "paragraph", content: [{ type: "text", text: "" }] },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Career Development" }],
            },
            { type: "paragraph", content: [{ type: "text", text: "" }] },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Feedback" }],
            },
            { type: "paragraph", content: [{ type: "text", text: "" }] },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Action Items" }],
            },
            {
              type: "checkListItem",
              attrs: { checked: false },
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Action item 1" }] },
              ],
            },
          ],
        },
        isBuiltIn: true,
        isPublic: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Insert all built-in templates
    for (const template of builtInTemplates) {
      await ctx.db.insert("documentTemplates", template as any);
    }

    return { message: `Created ${builtInTemplates.length} built-in templates` };
  },
});
