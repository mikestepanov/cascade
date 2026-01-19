# Nixelo - Agent Instructions

## Project Context

Nixelo is a modern web application built with the following technologies:

- **Frontend**: React 19, Vite, TanStack Router (File-based routing).
- **Backend**: Convex (Real-time database and backend functions).
- **Styling**: Tailwind CSS v4, utilizing semantic color tokens (e.g., `bg-ui-bg-primary`, `text-ui-text-secondary`) and Lucide React for icons.
- **Language**: Strict TypeScript.
- **Tooling**: Biome (Linting/Formatting), Vitest (Unit Tests), Playwright (E2E Tests), pnpm (Package Manager).

## Architectural Principles

1. **Strict TypeScript**: Avoid `any`. Use strict type definitions for all props, state, and return values.
2. **Functional Components**: Use React functional components with hooks. Avoid class components.
3. **Styling**:
   - Use Tailwind CSS utility classes.
   - **Do not** use arbitrary values (e.g., `h-[50px]`). Use standard spacing tokens.
   - Use semantic color tokens defined in `index.css`/`tailwind.config.js` for dark mode compatibility.
   - Use `class-variance-authority` (cva) for component variants.
4. **Backend/Frontend Separation**:
   - Convex functions (`query`, `mutation`, `action`) reside in the `convex/` directory.
   - Frontend components reside in `src/`.
   - Respect the boundary: Frontend components import backend functions to fetch data/trigger mutations.
5. **Routing**: Follow TanStack Router patterns in `src/routes`.

## Behavior

- **Do not hallucinate imports.** Always check if a library is installed (`package.json`) before importing it.
- **Verify File Paths**: Ensure imports point to existing files. Use `@/` alias for `src/` where configured.
- **Context Awareness**: Read `README.md` and existing code to understand conventions before changing them.

## Testing

### Local Quality Checks

Before submitting PRs, run the following commands. These are also enforced by CI and pre-commit hooks:

- `pnpm run check`: TypeScript type checking + linting.
- `pnpm run typecheck`: TypeScript type checking only.
- `pnpm run biome`: Biome linting with auto-fix.
- `pnpm run format`: Biome formatting with auto-fix.
- `pnpm test`: Run unit tests.

### New Logic Requires New Tests

- Unit tests for utilities/hooks (Vitest).
- Component tests (React Testing Library).
- E2E tests for critical flows (Playwright).

### Run Tests

Verify changes with `pnpm test` or specific test files.
