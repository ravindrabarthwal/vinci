# E2E TESTING GUIDE

## PHILOSOPHY

**User journeys, not BDD fragments.** Each test is isolated with fresh browser state. Small BDD-style tests ("given button clicked, then success") break when the next step requires login state from previous test.

### Why NOT BDD-Style in E2E

```typescript
// BAD: Fragmented BDD tests break isolation
test("given signup form filled, then submit succeeds", ...);
test("given user on dashboard, then sees welcome", ...);  // FAILS - user not logged in!

// GOOD: Complete user journey
test("new user can signup and reach dashboard", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign up" }).click();
  
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByText("Welcome")).toBeVisible();
});
```

**Each test must be self-contained and tell a complete user story.**

## STRUCTURE

```
e2e/
├── auth.setup.ts         # Authentication setup (runs before all tests)
├── fixtures/
│   └── index.ts          # Custom fixtures (authenticated pages, POMs)
├── pages/                # Page Object Models
│   ├── login.page.ts
│   ├── dashboard.page.ts
│   └── org-settings.page.ts
├── journeys/             # User journey tests (grouped by feature)
│   ├── auth.spec.ts      # Signup, login, logout journeys
│   ├── organization.spec.ts
│   └── invite.spec.ts
└── AGENTS.md
```

## PATTERNS

### 1. Authentication Setup (REQUIRED)

Use Playwright's setup project to authenticate once, reuse in all tests:

```typescript
// e2e/auth.setup.ts
import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel("Password").fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  
  // Wait for auth to complete
  await expect(page).toHaveURL("/dashboard");
  
  // Save auth state
  await page.context().storageState({ path: authFile });
});
```

Update `playwright.config.ts`:
```typescript
projects: [
  { name: "setup", testMatch: /.*\.setup\.ts/ },
  {
    name: "chromium",
    use: {
      ...devices["Desktop Chrome"],
      storageState: "playwright/.auth/user.json",
    },
    dependencies: ["setup"],
  },
],
```

### 2. Page Object Models (Recommended)

Encapsulate page interactions for reuse:

```typescript
// e2e/pages/dashboard.page.ts
import { type Page, type Locator, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly welcomeHeading: Locator;
  readonly createOrgButton: Locator;
  readonly userMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeHeading = page.getByRole("heading", { name: /welcome/i });
    this.createOrgButton = page.getByRole("button", { name: "Create Organization" });
    this.userMenu = page.getByTestId("user-menu");
  }

  async goto() {
    await this.page.goto("/dashboard");
    await expect(this.welcomeHeading).toBeVisible();
  }

  async openUserMenu() {
    await this.userMenu.click();
  }

  async logout() {
    await this.openUserMenu();
    await this.page.getByRole("menuitem", { name: "Log out" }).click();
  }
}
```

### 3. User Journey Tests

Write tests as complete user stories:

```typescript
// e2e/journeys/organization.spec.ts
import { test, expect } from "@playwright/test";
import { DashboardPage } from "../pages/dashboard.page";

test.describe("Organization Management", () => {
  test("user can create a new organization", async ({ page }) => {
    // Arrange
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Act - Complete journey
    await dashboard.createOrgButton.click();
    await page.getByLabel("Organization name").fill("Acme Corp");
    await page.getByLabel("Slug").fill("acme-corp");
    await page.getByRole("button", { name: "Create" }).click();

    // Assert - Final state
    await expect(page).toHaveURL(/\/org\/acme-corp/);
    await expect(page.getByText("Acme Corp")).toBeVisible();
  });

  test("user can invite team member to organization", async ({ page }) => {
    // This test assumes org exists - setup in beforeEach or use existing test data
    await page.goto("/org/acme-corp/settings");
    
    await page.getByRole("button", { name: "Invite Member" }).click();
    await page.getByLabel("Email").fill("teammate@example.com");
    await page.getByRole("combobox", { name: "Role" }).selectOption("member");
    await page.getByRole("button", { name: "Send Invite" }).click();

    await expect(page.getByText("Invitation sent")).toBeVisible();
  });
});
```

### 4. Tests Without Auth

For public pages (login, signup, landing):

```typescript
// e2e/journeys/auth.spec.ts
import { test, expect } from "@playwright/test";

// Reset storage state - start unauthenticated
test.use({ storageState: { cookies: [], origins: [] } });

test("new user can complete signup flow", async ({ page }) => {
  await page.goto("/signup");
  
  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill(`test-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("SecurePass123!");
  await page.getByRole("button", { name: "Create account" }).click();

  // Verify complete journey
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByText("Welcome, Test User")).toBeVisible();
});

test("existing user can login", async ({ page }) => {
  await page.goto("/login");
  
  await page.getByLabel("Email").fill("existing@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/dashboard");
});
```

## LOCATOR PRIORITY

Use user-facing locators (resilient to DOM changes):

```typescript
// PREFERRED (in order)
page.getByRole("button", { name: "Submit" });     // Accessibility role
page.getByLabel("Email");                          // Form labels
page.getByText("Welcome back");                    // Visible text
page.getByPlaceholder("Enter email");              // Placeholder
page.getByTestId("submit-btn");                    // data-testid (last resort)

// AVOID
page.locator(".btn-primary");                      // CSS class
page.locator("#submit-button");                    // ID
page.locator("button.btn.btn-lg.btn-primary");     // Fragile selectors
```

## ASSERTIONS

Use web-first assertions (auto-wait + retry):

```typescript
// GOOD - waits automatically
await expect(page.getByText("Success")).toBeVisible();
await expect(page).toHaveURL("/dashboard");
await expect(page.getByRole("button")).toBeEnabled();

// BAD - doesn't wait, flaky
expect(await page.getByText("Success").isVisible()).toBe(true);
```

## TEST NAMING

Name tests as user stories:

```typescript
// GOOD - describes complete journey
test("user can create organization and invite first member");
test("admin can remove member from organization");
test("invited user can accept invitation and join org");

// BAD - fragments, unclear outcome
test("clicking create button");
test("form validation");
test("navigation works");
```

## COMMANDS

```bash
bun run test:e2e           # Run all E2E tests
bun run test:e2e:ui        # Interactive UI mode (recommended for writing tests)
bun run test:e2e -- --debug  # Debug mode with inspector
bun run test:e2e -- --trace on  # Record traces for all tests
```

## AI AGENT INSTRUCTIONS

When writing E2E tests:

1. **Think in user journeys**: What does the user want to accomplish end-to-end?
2. **One test = one complete story**: Login → action → verification
3. **Use POMs for repeated interactions**: Create page classes for complex pages
4. **Prefer role-based locators**: `getByRole`, `getByLabel`, `getByText`
5. **Self-contained tests**: Each test should work if run alone
6. **Don't chain tests**: Never rely on state from previous test

### Test Template

```typescript
test("[persona] can [complete action]", async ({ page }) => {
  // ARRANGE - Navigate to starting point
  await page.goto("/starting-page");
  
  // ACT - Perform the user journey (multiple steps OK)
  await page.getByLabel("Field").fill("value");
  await page.getByRole("button", { name: "Action" }).click();
  // ... more steps as needed
  
  // ASSERT - Verify final state (not intermediate states)
  await expect(page).toHaveURL("/expected-destination");
  await expect(page.getByText("Expected outcome")).toBeVisible();
});
```

## ANTI-PATTERNS

- **Never** write tests that depend on other tests running first
- **Never** use `page.waitForTimeout()` (use proper assertions instead)
- **Never** use CSS class selectors for element selection
- **Never** test third-party services (mock them with `page.route()`)
- **Never** write many small assertions in separate tests (combine into journeys)
