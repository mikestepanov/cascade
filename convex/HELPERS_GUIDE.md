# Convex Helpers Integration Guide

This guide explains how to use `convex-helpers` in the Nixelo project for cleaner, more maintainable backend code.

---

## 📦 What's Installed

```json
{
  "convex-helpers": "^0.1.105"
}
```

**Official package by Convex team** - provides advanced patterns and utilities.

---

## 📋 Index Naming Convention

**Standard Pattern:** `by_{foreignKey}` for single-field indexes (e.g., `by_project` for `projectId`, `by_workspace` for `workspaceId`)

**Compound indexes:** `by_{table}_{field}` or `by_{field1}_{field2}`

---

## 🎯 What We're Using

### 1. **Custom Functions** ⭐ Primary Feature

Located in: `convex/customFunctions.ts`

**Pre-built authentication & permission wrappers:**

| Function                | Auth | RBAC    | Use For                      |
| ----------------------- | ---- | ------- | ---------------------------- |
| `authenticatedQuery`    | ✅   | ❌      | Any query requiring login    |
| `authenticatedMutation` | ✅   | ❌      | Any mutation requiring login |
| `projectQuery`          | ✅   | Viewer+ | Reading project data         |
| `viewerMutation`        | ✅   | Viewer+ | Commenting, watching         |
| `editorMutation`        | ✅   | Editor+ | Creating/editing issues      |
| `issueMutation`         | ✅   | Editor+ | Issue-specific operations    |

**Context injected automatically:**

- `ctx.userId` - Current user ID
- `ctx.projectId` - Project ID (project mutations)
- `ctx.role` - User's role in project
- `ctx.project` - Full project object
- `ctx.issue` - Full issue object (issueMutation only)

### 2. **Rate Limiting**

Located in: `convex/rateLimiting.ts`

**Pre-configured rate limiters:**

| Limiter                       | Limit   | Use For                  |
| ----------------------------- | ------- | ------------------------ |
| `strictRateLimitedMutation`   | 10/min  | Creating issues, invites |
| `moderateRateLimitedMutation` | 30/min  | Updates, comments        |
| `lenientRateLimitedMutation`  | 100/min | Lightweight operations   |
| `apiRateLimitedMutation`      | 60/min  | Public API endpoints     |

---

## 🚀 Quick Start

### Before (Traditional Pattern)

```typescript
// ❌ Old way - lots of boilerplate
export const updateIssue = mutation({
  args: { issueId: v.id("issues"), title: v.string() },
  handler: async (ctx, args) => {
    // 1. Check authentication
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // 2. Load issue
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    // 3. Load project
    const project = await ctx.db.get(issue.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // 4. Check permissions
    await assertMinimumRole(ctx, issue.projectId, userId, "editor");

    // 5. Finally, business logic!
    await ctx.db.patch(args.issueId, { title: args.title });

    return issue;
  },
});
```

### After (Custom Functions)

```typescript
// ✅ New way - clean and focused
export const updateIssue = issueMutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    // ctx.userId, ctx.issue, ctx.project, ctx.role already available!
    // Auth & permissions already checked ✅

    await ctx.db.patch(ctx.issue._id, { title: args.title });

    return ctx.issue;
  },
});
```

**Reduction:** ~60% less code, 100% clearer intent!

---

## 📚 Usage Examples

### Example 1: Simple Authenticated Query

```typescript
import { authenticatedQuery } from "./customFunctions";

export const getCurrentUser = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    // ctx.userId is automatically available
    return await ctx.db.get(ctx.userId);
  },
});
```

### Example 2: Project Mutation (Editor Role)

```typescript
import { editorMutation } from "./customFunctions";

export const createIssue = editorMutation({
  args: {
    // projectId automatically required by editorMutation
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // ctx.userId - current user
    // ctx.projectId - project ID
    // ctx.role - user's role (guaranteed "editor" or "admin")
    // ctx.project - full project object

    const issueId = await ctx.db.insert("issues", {
      projectId: ctx.projectId,
      title: args.title,
      description: args.description,
      reporterId: ctx.userId,
      // ...
    });

    return issueId;
  },
});
```

### Example 3: Rate-Limited Mutation

```typescript
import { strictRateLimitedMutation } from "./rateLimiting";

export const sendInvite = strictRateLimitedMutation({
  args: { email: v.string(), projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Rate limit: 10 requests/minute per user
    // ctx.userId automatically available

    // Send invite email...

    return { success: true };
  },
});
```

### Example 4: Issue-Specific Mutation

```typescript
import { issueMutation } from "./customFunctions";

export const addComment = issueMutation({
  args: {
    // issueId automatically required
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // ctx.issue - full issue object
    // ctx.project - full project object
    // ctx.role - user's role in project

    const commentId = await ctx.db.insert("issueComments", {
      issueId: ctx.issue._id,
      authorId: ctx.userId,
      content: args.content,
      createdAt: Date.now(),
    });

    return commentId;
  },
});
```

---

## 🔧 Advanced Usage

### Creating Custom Rate Limiters

```typescript
import { rateLimitedMutation } from "./rateLimiting";

export const customRateLimiter = rateLimitedMutation({
  keyPrefix: "custom",
  maxRequests: 5,
  windowMs: 10 * 60 * 1000, // 10 minutes
});

export const heavyOperation = customRateLimiter({
  args: { data: v.string() },
  handler: async (ctx, args) => {
    // Rate limited to 5 requests per 10 minutes
    // ...
  },
});
```

### Combining Custom Functions

```typescript
// You can compose custom functions for complex scenarios
import { customMutation } from "convex-helpers/server/customFunctions";

export const complexMutation = customMutation(mutation, {
  args: { projectId: v.id("projects") },
  input: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const role = await getUserRole(ctx, args.projectId, userId);

    // Custom business logic here
    const specialData = await loadSpecialData(ctx);

    return {
      ctx: { ...ctx, userId, project, role, specialData },
      args: {},
    };
  },
});
```

---

## 🎨 Best Practices

### 1. **Choose the Right Builder**

```typescript
// ✅ Good - use specific builder
export const updateIssue = editorMutation({ ... });

// ❌ Bad - manual checks in authenticated mutation
export const updateIssue = authenticatedMutation({
  handler: async (ctx, args) => {
    await assertMinimumRole(...); // Don't do this!
  }
});
```

### 2. **Keep Handlers Focused**

```typescript
// ✅ Good - handler only contains business logic
export const createIssue = editorMutation({
  handler: async (ctx, args) => {
    const issueId = await ctx.db.insert("issues", { ... });
    await logActivity(ctx, issueId);
    return issueId;
  },
});

// ❌ Bad - mixing auth/validation with business logic
export const createIssue = mutation({
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx); // Boilerplate
    if (!userId) throw new Error(...);       // Boilerplate
    const project = await ctx.db.get(...);   // Boilerplate
    await assertMinimumRole(...);             // Boilerplate

    const issueId = await ctx.db.insert("issues", { ... }); // Actual logic
    return issueId;
  },
});
```

### 3. **Use Rate Limiting for Public Endpoints**

```typescript
// ✅ Always rate limit operations that:
// - Send emails
// - Create expensive resources
// - Are exposed to public API
// - Could be abused

export const sendInvite = strictRateLimitedMutation({ ... });
export const createProject = moderateRateLimitedMutation({ ... });
```

### 4. **Type Safety**

```typescript
import type { ProjectQueryCtx } from "./customFunctions";

// Use exported types for helper functions
async function myHelper(ctx: ProjectQueryCtx) {
  // ctx.userId, ctx.project, ctx.role all typed correctly
}

export const myMutation = projectQuery({
  handler: async (ctx, args) => {
    await myHelper(ctx); // ✅ Type-safe!
  },
});
```

---

## 📖 Migration Guide

### Migrating Existing Mutations

**Step 1:** Identify the pattern

- Does it need auth? → `authenticatedMutation`
- Does it need project permissions? → `editorMutation`
- Does it work on specific issue? → `issueMutation`

**Step 2:** Update the function signature

```typescript
// Before
export const myMutation = mutation({
  args: { projectId: v.id("projects"), ... },
  handler: async (ctx, args) => { ... }
});

// After
export const myMutation = editorMutation({
  args: { /* projectId removed - handled by builder */ ... },
  handler: async (ctx, args) => { ... }
});
```

**Step 3:** Remove boilerplate

```typescript
// Remove these lines:
const userId = await getAuthUserId(ctx);
if (!userId) throw new Error("Not authenticated");
const project = await ctx.db.get(args.projectId);
if (!project) throw new Error("Project not found");
await assertMinimumRole(ctx, args.projectId, userId, "editor");

// Replace with context access:
// ctx.userId
// ctx.project
// ctx.role
```

**Step 4:** Test thoroughly

- Verify auth still works
- Verify permissions still enforced
- Test error cases

---

## 🧪 Testing Custom Functions

```typescript
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup";

describe("Custom Functions", () => {
  it("should reject unauthenticated requests", async () => {
    const t = convexTest(schema, modules);

    // No auth session
    await expect(
      t.mutation(api.issues.create, { title: "Test" })
    ).rejects.toThrow("Authentication required");
  });

  it("should reject users without editor role", async () => {
    const t = convexTest(schema, modules);

    const userId = await createTestUser(t, { name: "Viewer" });
    const projectId = await createTestProject(t, userId);

    // Add user as viewer only
    await addProjectMember(t, projectId, userId, "viewer");

    // Try to create issue (requires editor role)
    await expect(
      t.mutation(api.issues.create, {
        projectId,
        title: "Test Issue",
      })
    ).rejects.toThrow("editor role required");
  });
});
```

---

## 🔗 Resources

- [convex-helpers GitHub](https://github.com/get-convex/convex-helpers)
- [Custom Functions Stack Post](https://stack.convex.dev/custom-functions)
- [Convex Documentation](https://docs.convex.dev/)

---

## 📋 Summary

**With convex-helpers you get:**

- ✅ 30-60% less boilerplate code
- ✅ Consistent auth & permission patterns
- ✅ Type-safe context injection
- ✅ Built-in rate limiting
- ✅ Easier testing
- ✅ Better code organization
- ✅ Fewer bugs from missed auth checks

**Next Steps:**

1. Review `convex/issuesRefactored.example.ts` for complete examples
2. Start migrating mutations one at a time
3. Add rate limiting to public endpoints
4. Enjoy cleaner code! 🎉
