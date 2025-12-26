# Nixelo SEO Strategy

> **Note**: Since Nixelo uses React 19 + Vite + TanStack Router (SPA), the SEO strategy relies on pre-rendering and meta tag management.

## 1. SPA SEO Strategy (Vite)

Since Nixelo is a Single Page App (SPA), strict server-side rendering (like Next.js) is not the default.

1.  **Meta Tags**: Use `@tanstack/react-router` or `react-helmet-async` to manage `<head>` tags.
2.  **Pre-rendering**: Use tools like `prerender.io` or logical SSR if needed for public pages.

## 2. Public vs. Private Strategy

Since Nixelo is a secure Enterprise SaaS, 90% of pages should NOT be indexed.

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
