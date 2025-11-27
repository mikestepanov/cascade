# E2E Testing with Playwright

End-to-end testing for Cascade using [Playwright](https://playwright.dev/).

## Quick Start

```bash
# Run all E2E tests (headless)
pnpm e2e

# Interactive UI mode (recommended for development)
pnpm e2e:ui

# Run with visible browser
pnpm e2e:headed

# Debug mode with inspector
pnpm e2e:debug
```

## Configuration

**File:** `playwright.config.ts`

### Key Settings

| Setting | Local | CI |
|---------|-------|-----|
| Base URL | `http://localhost:5555` | `http://localhost:5555` |
| Browser | Chromium | Chromium |
| Workers | Auto | 1 |
| Retries | 0 | 2 |
| Parallel | Yes | Yes |

### Timeouts

| Type | Duration |
|------|----------|
| Test timeout | 30 seconds |
| Expect timeout | 5 seconds |
| Action timeout | 10 seconds |
| Navigation timeout | 15 seconds |

### Debug Artifacts

| Artifact | When Captured |
|----------|---------------|
| Trace | On first retry |
| Screenshot | Only on failure |
| Video | On first retry |

## Architecture

```
e2e/
├── fixtures/                   # Test fixtures
│   ├── index.ts               # Exports all fixtures
│   ├── test.fixture.ts        # Base fixtures (page objects)
│   └── auth.fixture.ts        # Authenticated user fixtures
│
├── pages/                      # Page Object Models
│   ├── index.ts               # Exports all pages
│   ├── base.page.ts           # Base page with common methods
│   ├── auth.page.ts           # Auth forms (sign in/up, reset)
│   ├── dashboard.page.ts      # Main app dashboard
│   └── landing.page.ts        # Landing page
│
├── utils/                      # Test utilities
│   ├── index.ts
│   └── test-helpers.ts        # Helper functions
│
├── auth.spec.ts               # Authentication tests
├── global-setup.ts            # Pre-test setup
├── global-teardown.ts         # Post-test cleanup
└── setup-auth.ts              # Auth state setup script
```

## Page Object Model

We use the [Page Object Model](https://playwright.dev/docs/pom) pattern for maintainable tests.

### Base Page

All page objects extend `BasePage`:

```typescript
// e2e/pages/base.page.ts
export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  abstract goto(): Promise<void>;

  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  // Toast helpers (Sonner)
  getToast(text?: string): Locator {
    if (text) {
      return this.page.locator("[data-sonner-toast]").filter({ hasText: text });
    }
    return this.page.locator("[data-sonner-toast]");
  }

  async expectToast(text: string) {
    await expect(this.getToast(text)).toBeVisible();
  }
}
```

### Example Page Object

```typescript
// e2e/pages/auth.page.ts
export class AuthPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByPlaceholder("Email");
    this.passwordInput = page.getByPlaceholder("Password");
    this.submitButton = page.getByRole("button", { name: /sign (in|up)/i });
  }

  async goto() {
    await this.page.goto("/");
    await this.waitForLoad();
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

## Fixtures

Fixtures provide page objects to tests automatically.

### Base Fixtures

```typescript
// e2e/fixtures/test.fixture.ts
import { test as base } from "@playwright/test";
import { AuthPage, DashboardPage, LandingPage } from "../pages";

export const test = base.extend<TestFixtures>({
  landingPage: async ({ page }, use) => {
    await use(new LandingPage(page));
  },
  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});
```

### Usage in Tests

```typescript
import { test, expect } from "./fixtures";

test("can sign in", async ({ authPage }) => {
  await authPage.goto();
  await authPage.signIn("user@example.com", "password");
  // Assertions...
});
```

## Authentication

### Saving Auth State

For tests requiring logged-in users:

```bash
# 1. Start dev server
pnpm dev

# 2. Run auth setup (opens browser)
pnpm e2e:setup-auth
```

This opens a browser where you manually log in. The session is saved to `e2e/.auth/user.json`.

### Using Auth State in Tests

```typescript
import { authenticatedTest, expect } from "./fixtures";

authenticatedTest("shows dashboard", async ({ dashboardPage }) => {
  await dashboardPage.goto();
  await expect(dashboardPage.dashboardTab).toBeVisible();
});
```

### Auth Fixture Implementation

```typescript
// e2e/fixtures/auth.fixture.ts
const AUTH_STATE_PATH = path.join(__dirname, "../.auth/user.json");

export const authenticatedTest = base.extend<AuthFixtures>({
  storageState: AUTH_STATE_PATH,  // Uses saved cookies/localStorage

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});
```

## Selector Strategy

### Preferred Selectors (Accessible)

```typescript
// Role-based (most resilient)
page.getByRole("button", { name: /submit/i })
page.getByRole("heading", { name: /welcome/i })
page.getByRole("link", { name: /home/i })

// Form inputs
page.getByLabel("Email")
page.getByPlaceholder("Enter your email")

// Visible text
page.getByText("Sign in")
page.getByText(/welcome back/i)
```

### Avoid

```typescript
// CSS selectors (brittle)
page.locator(".btn-primary")
page.locator("#submit-button")

// XPath (complex, hard to maintain)
page.locator("//button[@type='submit']")
```

### Test IDs (Last Resort)

Only use when accessible selectors aren't possible:

```typescript
// In component
<div data-testid="user-avatar" />

// In test
page.getByTestId("user-avatar")
```

## Writing Tests

### Test Structure

```typescript
import { test, expect } from "./fixtures";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto();
  });

  test("does something expected", async ({ authPage }) => {
    // Arrange - setup is in beforeEach

    // Act
    await authPage.signIn("user@example.com", "password");

    // Assert
    await expect(authPage.page).toHaveURL(/dashboard/);
  });
});
```

### Test Categories

**UI Tests** (no backend required):
```typescript
test("displays sign in form", async ({ authPage }) => {
  await authPage.goto();
  await expect(authPage.emailInput).toBeVisible();
  await expect(authPage.passwordInput).toBeVisible();
});
```

**Integration Tests** (requires backend):
```typescript
test("sign up sends verification email", async ({ authPage }) => {
  await authPage.goto();
  await authPage.signUp("new@example.com", "Password123!");
  await authPage.expectVerificationForm();
});
```

### Skipping Tests

```typescript
// Skip individual test
test.skip("feature not implemented", async () => {});

// Skip conditionally
test("only on CI", async () => {
  test.skip(!process.env.CI, "CI only");
});

// Skip entire describe block
test.describe.skip("WIP feature", () => {});
```

## Debugging

### Visual Debugging

```bash
pnpm e2e:debug
```

This opens Playwright Inspector where you can:
- Step through tests
- View page state
- Generate selectors
- See action logs

### Trace Viewer

Failed tests in CI generate traces:

```bash
# View trace file
npx playwright show-trace trace.zip
```

### Screenshots

Failed tests capture screenshots to `test-results/`:

```typescript
// Manual screenshot
await page.screenshot({ path: "debug.png" });

// Via page object
await authPage.screenshot("login-form");
```

### Console Logs

```typescript
test("debug example", async ({ page }) => {
  page.on("console", (msg) => console.log(msg.text()));
  // ... test code
});
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Install Playwright
  run: npx playwright install chromium

- name: Run E2E tests
  run: pnpm e2e
  env:
    CI: true
```

### Reporter Configuration

```typescript
// playwright.config.ts
reporter: process.env.CI
  ? [["html", { open: "never" }], ["github"]]
  : [["html", { open: "on-failure" }]],
```

## AI-Assisted Testing (MCP)

The Playwright MCP Server enables Claude Code to interact with your app visually.

### Configuration

`.claude/mcp.json`:
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

### Manual Usage

```bash
npx @playwright/mcp@latest
```

### Capabilities

- Navigate the app
- Interact with elements
- Generate test assertions
- Debug failing tests visually

## Best Practices

1. **Use page objects** - Keep selectors in one place
2. **Test user flows** - Not implementation details
3. **Use role-based selectors** - More resilient to changes
4. **Keep tests independent** - No shared state
5. **Use fixtures** - For common setup/teardown
6. **Test error states** - Not just happy paths
7. **Run locally before CI** - Catch issues early

## Troubleshooting

### Tests timeout

- Increase timeout in config
- Check if server is running
- Verify selectors match current UI

### Element not found

- Use Playwright Inspector to find correct selector
- Check if element is in viewport
- Verify element is not in shadow DOM

### Flaky tests

- Add explicit waits for dynamic content
- Use `waitForLoadState("networkidle")`
- Check for race conditions

---

**Related Documentation:**
- [Testing Overview](./README.md)
- [E2E Test Files](../../e2e/)
- [Playwright Docs](https://playwright.dev/docs/intro)

---

*Last Updated: 2025-11-27*
