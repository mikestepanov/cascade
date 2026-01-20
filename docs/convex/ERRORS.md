# Convex Error Handling Guide

Standard error patterns for the Nixelo Convex backend.

## Error Types

All errors use `ConvexError` with typed payloads from `convex/lib/errors.ts`.

### Error Codes

| Code | HTTP Equiv | When to Use |
|------|-----------|-------------|
| `UNAUTHENTICATED` | 401 | No valid auth session |
| `FORBIDDEN` | 403 | Authenticated but not authorized |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION` | 400 | Invalid input data |
| `CONFLICT` | 409 | Duplicate/conflict (e.g., email in use) |
| `RATE_LIMITED` | 429 | Too many requests |

## Usage

### Import Error Helpers

```typescript
import {
  unauthenticated,
  forbidden,
  notFound,
  validation,
  conflict,
  requireOwned,
} from "./lib/errors";
```

### Authentication Errors

```typescript
// User not logged in
if (!userId) {
  throw unauthenticated();
}
```

### Authorization Errors

```typescript
// Generic forbidden
throw forbidden();

// With required role
throw forbidden("admin");

// With custom message
throw forbidden("editor", "Only editors can modify this document");
```

### Not Found Errors

```typescript
// Resource not found
const project = await ctx.db.get(projectId);
if (!project) {
  throw notFound("project", projectId);
}

// Or without ID
throw notFound("project");
```

### Validation Errors

```typescript
// Invalid field
if (!isValidEmail(email)) {
  throw validation("email", "Invalid email format");
}

// Missing required field
if (!args.title?.trim()) {
  throw validation("title", "Title is required");
}
```

### Conflict Errors

```typescript
// Duplicate resource
const existing = await ctx.db.query("users")
  .withIndex("email", q => q.eq("email", email))
  .first();

if (existing) {
  throw conflict("Email already in use");
}
```

### Ownership Checks

```typescript
// Combined not-found + ownership check
const key = await ctx.db.get(keyId);
requireOwned(key, ctx.userId, "apiKey");
// Throws NOT_FOUND if null, FORBIDDEN if wrong owner
```

## Client-Side Handling

### React Example

```typescript
import { ConvexError } from "convex/values";

try {
  await mutation({ ... });
} catch (error) {
  if (error instanceof ConvexError) {
    const { code, message } = error.data;

    switch (code) {
      case "UNAUTHENTICATED":
        redirect("/signin");
        break;
      case "FORBIDDEN":
        toast.error("You don't have permission to do this");
        break;
      case "NOT_FOUND":
        toast.error(`${error.data.resource} not found`);
        break;
      case "VALIDATION":
        setFieldError(error.data.field, error.data.message);
        break;
      case "CONFLICT":
        toast.error(message);
        break;
      default:
        toast.error("An error occurred");
    }
  }
}
```

### Type-Safe Error Handling

```typescript
import type { ErrorCode, ConvexErrorData } from "convex/lib/errors";

function handleError(error: ConvexError<ConvexErrorData>) {
  const { code } = error.data;
  // TypeScript knows code is ErrorCode
}
```

## Error Payloads

### Unauthenticated
```typescript
{ code: "UNAUTHENTICATED", message: "Authentication required" }
```

### Forbidden
```typescript
{ code: "FORBIDDEN", message: "...", role?: "admin" | "editor" | "viewer" }
```

### Not Found
```typescript
{ code: "NOT_FOUND", message: "...", resource: "project", id?: "abc123" }
```

### Validation
```typescript
{ code: "VALIDATION", message: "...", field: "email" }
```

### Conflict
```typescript
{ code: "CONFLICT", message: "Email already in use" }
```

## Best Practices

1. **Use helpers, not raw ConvexError** - Ensures consistent payloads
2. **Include context** - Add resource type, field name, IDs when relevant
3. **Use requireOwned()** - Combines not-found + ownership in one check
4. **Validate early** - Check inputs at the start of handlers
5. **Don't expose internals** - Keep error messages user-friendly

## Migration from throw new Error

```typescript
// ❌ Old pattern (message redacted in production)
throw new Error("Project not found");

// ✅ New pattern (data preserved in production)
throw notFound("project", projectId);
```
