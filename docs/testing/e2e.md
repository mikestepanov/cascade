# E2E Testing with Playwright

End-to-end testing for Nixelo using [Playwright](https://playwright.dev/).

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
│   ├── mailtrap.ts            # Mailtrap API for OTP verification
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

### Test Users

Test users are configured in `e2e/config.ts`. All use `@inbox.mailtrap.io` for email verification.

| User Key | Email | Role | Description |
|----------|-------|------|-------------|
| `dashboard` | `e2e-dashboard@inbox.mailtrap.io` | editor | Default test user (created automatically) |
| `admin` | `e2e-admin@inbox.mailtrap.io` | admin | Platform admin with full access |
| `teamLead` | `e2e-teamlead@inbox.mailtrap.io` | admin | Project admin with management access |
| `teamMember` | `e2e-member@inbox.mailtrap.io` | editor | Team member with edit permissions |
| `viewer` | `e2e-viewer@inbox.mailtrap.io` | viewer | Read-only access |

**Password:** All test users use `E2ETestPassword123!`

### Automatic User Setup

The `dashboard` user is created automatically by `global-setup.ts` on first run:
1. Tries to sign in (if user exists)
2. If sign-in fails, signs up with email verification via Mailtrap
3. Saves auth state to `e2e/.auth/user-dashboard.json`

Auth state is cached for 1 hour to avoid re-authentication on every run.

### Enabling Additional Test Users

To create additional users, uncomment them in `e2e/global-setup.ts`:

```typescript
const usersToSetup = [
  { key: "dashboard", user: TEST_USERS.dashboard, authPath: AUTH_PATHS.dashboard },
  // Uncomment to create (requires ~90s per user for email verification):
  // { key: "admin", user: TEST_USERS.admin, authPath: AUTH_PATHS.admin },
  // { key: "teamLead", user: TEST_USERS.teamLead, authPath: AUTH_PATHS.teamLead },
];
```

**Note:** Each new user requires email verification (~90 seconds), so enable only what you need.

### Auth State Files

| File | User |
|------|------|
| `e2e/.auth/user-dashboard.json` | Default dashboard user |
| `e2e/.auth/user-admin.json` | Admin user |
| `e2e/.auth/user-teamlead.json` | Team lead user |
| `e2e/.auth/user-member.json` | Team member user |
| `e2e/.auth/user-viewer.json` | Viewer user |

### IMPORTANT: Convex Auth Token Rotation

**Convex Auth uses refresh token rotation** - once a refresh token is used, it's invalidated and a new one is issued. This has critical implications for E2E testing:

**The Problem:**
1. Global setup signs in users and saves auth state (JWT + refresh token) to files
2. Test 1 loads auth from file, uses tokens → tokens get rotated in browser
3. Test 2 loads auth from SAME file → old tokens are now INVALID
4. Test 2 fails with authentication errors

**The Solution (implemented in `global-setup.ts`):**
```typescript
// Always delete stale auth files and create fresh tokens
if (fs.existsSync(authStatePath)) {
  fs.unlinkSync(authStatePath);
  console.log(`  🗑️ ${userKey}: Deleted stale auth state`);
}
```

**Key Rules for Convex Auth E2E Tests:**
1. **Never reuse auth state** - Always create fresh auth per test run
2. **Consolidate related tests** - Tests sharing the same user should be in one test file
3. **One user per test** - Don't use multiple auth contexts in a single test (tokens rotate independently)
4. **Worker isolation** - Use `--workers=1` for RBAC tests to ensure sequential execution

### Using Authenticated Tests

```typescript
import { authenticatedTest, expect } from "./fixtures";

authenticatedTest("shows dashboard", async ({ dashboardPage }) => {
  await dashboardPage.goto();
  await expect(dashboardPage.dashboardTab).toBeVisible();
});
```

### Re-Authentication After Sign Out

Tests that run after sign-out (which invalidates tokens) use `ensureAuthenticated`:

```typescript
test("test after signout", async ({ page, ensureAuthenticated }) => {
  await ensureAuthenticated();  // Re-logs in if needed
  // ... rest of test
});
```

### Skipping Auth State Save

Tests that modify auth state should use `skipAuthSave` to prevent corrupting the auth file:

```typescript
test.describe("Sign Out Tests", () => {
  test.use({ skipAuthSave: true });

  test("can sign out", async ({ page }) => {
    // This test invalidates tokens but won't corrupt auth file
  });
});
```

### Auth Fixture Implementation

```typescript
// e2e/fixtures/auth.fixture.ts
export const authenticatedTest = base.extend<AuthFixtures>({
  storageState: AUTH_PATHS.dashboard,  // Uses saved cookies/localStorage
  skipAuthSave: [false, { option: true }],  // Option to skip saving

  ensureAuthenticated: async ({ page }, use) => {
    // Re-authenticates if tokens are invalid
  },

  saveAuthState: async ({ context, skipAuthSave }, use) => {
    // Saves auth state after test (unless skipAuthSave is true)
  },
});
```

## Mailtrap OTP Verification

For tests requiring email verification (signup, password reset), we use Mailtrap to capture and read OTP codes.

### Setup

1. **Create Mailtrap Account:** [https://mailtrap.io](https://mailtrap.io) (free tier)
2. **Get Credentials:**
   - API Token: Settings → API Tokens
   - Account ID & Inbox ID: From inbox URL

3. **Set Environment Variables:**
```bash
MAILTRAP_API_TOKEN=your_token
MAILTRAP_ACCOUNT_ID=your_account_id
MAILTRAP_INBOX_ID=your_inbox_id
```

### Mailtrap Utilities

**File:** `e2e/utils/mailtrap.ts`

```typescript
import {
  waitForVerificationEmail,
  clearInbox,
} from "./utils/mailtrap";

// Clear inbox before test
await clearInbox();

// Wait for OTP email (polls every 2s, timeout 30s)
const otp = await waitForVerificationEmail("user@example.com", {
  timeout: 30000,
  pollInterval: 2000,
});
```

### Available Functions

| Function | Description |
|----------|-------------|
| `waitForVerificationEmail(email, options)` | Polls inbox, returns OTP code |
| `clearInbox()` | Deletes all messages (cleanup) |
| `getTestEmailAddress(prefix)` | Generates unique test email |

### Example: Signup Test with OTP

```typescript
import { test, expect } from "./fixtures";
import { waitForVerificationEmail, clearInbox } from "./utils/mailtrap";

test("complete signup flow with email verification", async ({ authPage }) => {
  // Setup
  await clearInbox();
  const testEmail = `e2e-${Date.now()}@inbox.mailtrap.io`;

  // Start signup
  await authPage.goto();
  await authPage.startSignUp(testEmail, "SecurePass123!");

  // Wait for verification email
  const otp = await waitForVerificationEmail(testEmail);

  // Enter OTP
  await authPage.enterOTP(otp);

  // Verify success
  await expect(authPage.page).toHaveURL(/dashboard|onboarding/);
});
```

### How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   E2E Test  │     │   Convex    │     │  Mailtrap   │
│             │     │   Backend   │     │   Sandbox   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ 1. Submit signup  │                   │
       │──────────────────>│                   │
       │                   │ 2. Send OTP email │
       │                   │──────────────────>│
       │                   │                   │
       │ 3. Poll for email │                   │
       │───────────────────────────────────────>
       │                   │                   │
       │ 4. Return email   │                   │
       │<──────────────────────────────────────│
       │                   │                   │
       │ 5. Extract OTP    │                   │
       │ 6. Submit OTP     │                   │
       │──────────────────>│                   │
       │                   │                   │
       │ 7. Verified!      │                   │
       │<──────────────────│                   │
```

### Troubleshooting

**OTP email not arriving:**
- Check Mailtrap inbox manually
- Verify `MAILTRAP_API_TOKEN` has correct permissions
- Check Convex logs for email sending errors

**Timeout waiting for email:**
- Increase `timeout` option (default 30s)
- Check if email provider is configured in Convex

**Cannot extract OTP:**
- OTP pattern expects 8-digit code
- Check email template format

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

## RBAC Testing

RBAC (Role-Based Access Control) tests verify permission boundaries for different user roles.

### Test Structure

RBAC tests are consolidated by role to avoid token rotation issues:

```
e2e/
├── fixtures/
│   └── rbac.fixture.ts    # RBAC-specific fixtures (admin/editor/viewer contexts)
└── rbac.spec.ts           # Consolidated RBAC tests (3 tests, one per role)
```

### Test Users & Roles

| Role | User | Permissions |
|------|------|-------------|
| Admin | `teamLead` | Full control - manage settings, members, delete project |
| Editor | `teamMember` | Create/edit issues, sprints, documents |
| Viewer | `viewer` | Read-only access, can only view and comment |

### Running RBAC Tests

```bash
# Run all RBAC tests (must use --workers=1)
pnpm e2e --grep "admin has full|editor has limited|viewer has read-only" --workers=1

# Run specific role test
pnpm e2e --grep "admin has full" --workers=1
```

### RBAC Fixtures

The `rbacTest` fixture provides authenticated contexts for each role:

```typescript
import { rbacTest, expect } from "./fixtures";

rbacTest("admin has full project access", async ({
  adminPage,           // Admin's page instance
  gotoRbacProject,     // Helper to navigate to RBAC project
  rbacProjectKey,      // Project key (e.g., "RBAC")
  rbacCompanySlug,     // Company slug from API
}) => {
  await gotoRbacProject(adminPage);
  // ... test admin permissions
});
```

### Why Tests Are Consolidated

Due to Convex auth token rotation, each role's tests must be in a SINGLE test:

**Before (17 tests - FAILED):**
```typescript
rbacTest("admin can view board", ...);     // Uses admin token → ROTATED
rbacTest("admin can create issue", ...);   // Same file → OLD TOKEN → FAIL
```

**After (3 tests - PASSES):**
```typescript
rbacTest("admin has full project access", async ({ adminPage }) => {
  // All admin assertions in ONE test
  // 1. View board ✓
  // 2. Create issue ✓
  // 3. Access settings ✓
  // ... etc
});
```

### RBAC Config

RBAC project configuration is saved by global-setup:

```
e2e/.auth/rbac-config.json
{
  "projectKey": "RBAC",
  "companySlug": "e2e-teamlead-xxxxx",  // Actual slug from API
  "projectId": "...",
  "companyId": "..."
}
```

This file is read by `rbac.fixture.ts` to get the correct company slug for navigation URLs.

---

**Related Documentation:**
- [Testing Overview](./README.md)
- [E2E Test Files](../../e2e/)
- [Playwright Docs](https://playwright.dev/docs/intro)

---

*Last Updated: 2025-12-09*
