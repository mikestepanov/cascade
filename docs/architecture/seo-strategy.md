# Cascade SEO Strategy

> **Note**: Since Cascade uses Convex (typically with React/Next.js), the SEO strategy depends on the frontend framework.

## Scenario A: Next.js (Recommended)

If Cascade uses Next.js, follow the **StartHub** pattern:

- Use server-side `generateMetadata`.
- Render JSON-LD on the server.

## Scenario B: Pure React SPA (Vite)

If Cascade is a Single Page App (SPA), SEO is harder.

1. **Pre-rendering**: Use tools like `react-snap` or Prerender.io.
2. **Meta Tags**: Use `react-helmet-async` for dynamic head management.

### Example (React Helmet)

```tsx
import { Helmet } from "react-helmet-async";

function ProjectPage({ project }) {
  return (
    <>
      <Helmet>
        <title>{project.title} | Cascade</title>
        <meta name="robots" content="noindex" /> {/* Secure App Content */}
      </Helmet>
      <h1>{project.title}</h1>
    </>
  );
}
```

## 2. Public vs. Private Strategy

Since Cascade is a secure Enterprise SaaS, 90% of pages should NOT be indexed.

| Page Type            | Strategy    | Robots Tag          |
| :------------------- | :---------- | :------------------ |
| **Landing Pages**    | **Index**   | `index, follow`     |
| **Blog / Changelog** | **Index**   | `index, follow`     |
| **Public Docs**      | **Index**   | `index, follow`     |
| **App Pages**        | **NoIndex** | `noindex, nofollow` |
| **Invite Links**     | **NoIndex** | `noindex, nofollow` |

### Programmatic Sitemaps

Only generate sitemaps for public content (Blogs + Marketing).
Do not expose `projectId` or `issueId` in sitemaps.
