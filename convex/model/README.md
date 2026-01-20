# Domain Model Layer

This directory contains domain logic separated from Convex function definitions.

## Purpose

The model layer encapsulates business logic that:
- Is reused across multiple queries/mutations
- Contains complex validation or computation
- Represents domain-specific operations

## Structure

```
convex/model/
├── README.md           # This file
├── issues.ts           # Issue domain logic
├── projects.ts         # Project domain logic
├── sprints.ts          # Sprint domain logic
└── ...
```

## Usage

```typescript
// In a Convex function
import { createIssueKey, validateIssueTransition } from "./model/issues";

export const createIssue = editorMutation({
  args: { title: v.string(), projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const key = await createIssueKey(ctx, args.projectId);
    // ...
  },
});
```

## Guidelines

1. **Keep functions pure when possible** - Domain logic should minimize side effects
2. **Accept context as first parameter** - Pass `ctx` for database access
3. **Use clear, descriptive names** - Domain functions describe business operations
4. **Document complex logic** - Add JSDoc for non-obvious behavior
5. **Test domain logic separately** - Domain functions are easier to unit test

## Migration

This directory is being populated incrementally. When adding new features or refactoring existing code, consider extracting domain logic here.

Priority for extraction:
1. Logic reused in 3+ places
2. Complex validation rules
3. Business calculations (velocity, burndown, etc.)
4. State transition logic

## Existing Patterns

The codebase already has domain logic in some places:

- `convex/issues/helpers.ts` - Issue domain logic (key generation, validation, filters)
- `convex/lib/softDeleteHelpers.ts` - Soft delete query helpers
- `convex/lib/boundedQueries.ts` - Bounded query helpers
- `convex/lib/errors.ts` - Typed error helpers

These serve as examples for the model layer pattern.
