# Testing Overview

Cascade uses a comprehensive testing strategy with three testing layers: unit tests, backend integration tests, and end-to-end (E2E) tests.

## Testing Stack

| Layer | Framework | Location | Purpose |
|-------|-----------|----------|---------|
| **Unit Tests** | Vitest + React Testing Library | `src/**/*.test.ts(x)` | Component & utility testing |
| **Backend Tests** | Vitest + convex-test | `convex/**/*.test.ts` | Convex function testing |
| **E2E Tests** | Playwright | `e2e/**/*.spec.ts` | Full user flow testing |

## Quick Start

```bash
# Run all tests
pnpm test              # Unit tests (watch mode)
pnpm test:convex       # Backend tests
pnpm e2e               # E2E tests (headless)

# Interactive modes
pnpm test:ui           # Unit tests with Vitest UI
pnpm e2e:ui            # E2E tests with Playwright UI

# CI mode (all tests)
pnpm run check         # Typecheck + lint + all tests
```

## Test Commands Reference

### Unit Tests (Vitest)

```bash
pnpm test              # Watch mode
pnpm test:ui           # Interactive UI
pnpm test:coverage     # Coverage report
pnpm test run          # Single run (CI)
```

### Backend Tests (Convex)

```bash
pnpm test:convex       # Run backend tests
pnpm test:convex:ui    # Interactive UI
pnpm test:convex:coverage  # Coverage report
```

### E2E Tests (Playwright)

```bash
pnpm e2e               # Headless
pnpm e2e:ui            # Interactive UI (recommended)
pnpm e2e:headed        # Visible browser
pnpm e2e:debug         # Debug with inspector
```

## Directory Structure

```
cascade/
├── src/
│   ├── components/
│   │   ├── MyComponent.tsx
│   │   └── MyComponent.test.tsx    # Unit test (co-located)
│   ├── lib/
│   │   ├── utils.ts
│   │   └── utils.test.ts           # Utility test
│   └── test/
│       └── setup.ts                # Vitest setup
│
├── convex/
│   ├── rbac.ts
│   ├── rbac.test.ts                # Backend test
│   ├── testSetup.ts                # convex-test setup
│   └── testUtils.ts                # Test helpers
│
├── e2e/
│   ├── fixtures/                   # Playwright fixtures
│   │   ├── test.fixture.ts
│   │   └── auth.fixture.ts
│   ├── pages/                      # Page Object Models
│   │   ├── base.page.ts
│   │   ├── auth.page.ts
│   │   └── dashboard.page.ts
│   ├── utils/                      # Test utilities
│   ├── auth.spec.ts                # Test specs
│   ├── global-setup.ts
│   └── global-teardown.ts
│
├── playwright.config.ts            # Playwright config
├── vitest.config.ts                # Vitest config
└── vitest.workspace.ts             # Workspace config
```

## Selector Strategy

We follow Playwright's recommended best practices for element selection:

### Preferred (Accessible Selectors)

```typescript
// Role-based (most resilient)
page.getByRole("button", { name: /submit/i })
page.getByRole("heading", { name: /welcome/i })

// User-visible attributes
page.getByLabel("Email")
page.getByPlaceholder("Enter your email")
page.getByText("Sign in")

// Test IDs (last resort)
page.getByTestId("submit-button")
```

### Selector Priority

1. **`getByRole`** - Accessible role + name (buttons, headings, links)
2. **`getByLabel`** - Form inputs with labels
3. **`getByPlaceholder`** - Form inputs without labels
4. **`getByText`** - Visible text content
5. **`getByTestId`** - Only when above options don't work

### When to Use `data-testid`

- Dynamic content without stable text
- Complex components with no semantic role
- Testing internal implementation details (unit tests)
- Mocked components in unit tests

## AI-Assisted Testing (MCP)

Cascade includes the [Playwright MCP Server](https://github.com/microsoft/playwright-mcp) for AI-assisted testing with Claude Code.

**Configuration:** `.claude/mcp.json`

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {
        "PLAYWRIGHT_HEADLESS": "true"
      }
    }
  }
}
```

**Capabilities:**
- Navigate and interact with the app visually
- Generate test assertions
- Debug failing tests
- Explore page structure

## Coverage Goals

| Layer | Target | Current |
|-------|--------|---------|
| Unit Tests | 70%+ | - |
| Backend Tests | 80%+ | ~50% |
| E2E Tests | Critical paths | Auth flows |

## Documentation

- [E2E Testing (Playwright)](./e2e.md) - Page objects, fixtures, authentication
- [Unit Testing (Vitest)](./unit.md) - Component testing, mocking
- [Backend Testing (Convex)](./backend.md) - convex-test, integration tests

## Best Practices

1. **Test user behavior, not implementation** - Focus on what users see and do
2. **Use accessible selectors** - Improves test resilience and accessibility
3. **Keep tests independent** - No shared state between tests
4. **Use fixtures for setup** - Reduces duplication
5. **Write descriptive test names** - Describe expected behavior
6. **Test error states** - Not just happy paths

---

**Related Documentation:**
- [Main Project Docs](../../CLAUDE.md)
- [E2E README](../../e2e/README.md)
- [Backend Testing](../../convex/README.md)

---

*Last Updated: 2025-11-27*
