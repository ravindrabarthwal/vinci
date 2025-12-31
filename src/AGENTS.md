# Next.js Frontend Guidelines

**Generated:** 2025-12-31

## CRITICAL ARCHITECTURE PATTERNS

### Provider Hierarchy

```
ErrorHandlerProvider (outermost)
└── ConvexClientProvider
    └── ConvexBetterAuthProvider
        └── OrganizationProvider (conditional - only renders for authenticated users)
```

**RULE**: OrganizationProvider only renders its context for authenticated users. This prevents unnecessary API calls (401 errors) for unauthenticated users on public pages.

### Auth-Aware Data Fetching

**WRONG** - Unconditional hooks that fire for all users:
```tsx
// ❌ This causes 401s on public pages
function OrganizationProvider({ children }) {
  const { data: session } = useSession();
  const { data: orgs } = useListOrganizations(); // Fires BEFORE checking session
  // ...
}
```

**RIGHT** - Conditional rendering based on auth state:
```tsx
// ✅ Only fetch org data when authenticated
function OrganizationProvider({ children }) {
  const { data: session, isPending } = useSession();
  
  if (isPending || !session) {
    return <>{children}</>;
  }
  
  return (
    <AuthenticatedOrganizationProvider>
      {children}
    </AuthenticatedOrganizationProvider>
  );
}
```

### React Router Redirects

**WRONG** - Calling router.push during render:
```tsx
// ❌ Causes "Cannot update component while rendering" error
if (!session) {
  router.push("/login");
  return null;
}
```

**RIGHT** - Use useEffect for navigation:
```tsx
// ✅ Proper redirect pattern
useEffect(() => {
  if (!isPending && !session) {
    router.push("/login");
  }
}, [session, isPending, router]);

if (isPending) {
  return <Loading />;
}

if (!session) {
  return null;
}
```

### Nullable Context Hooks

When context may not exist (e.g., unauthenticated users), hooks should return nullable values:

```tsx
// Hook that allows graceful handling
export function useOrganization(): OrganizationContextValue | null {
  return useContext(OrganizationContext);
}

// Consumer component
function MyComponent() {
  const orgContext = useOrganization();
  
  if (!orgContext) {
    return null; // Gracefully handle missing context
  }
  
  const { activeOrganization } = orgContext;
  // ...
}
```

## ANTI-PATTERNS (BLOCKING)

| Pattern | Problem | Solution |
|---------|---------|----------|
| `router.push()` in render | React error: setState during render | Use `useEffect` for redirects |
| Unconditional auth hooks in providers | 401s on public pages | Check session before calling org hooks |
| Destructuring nullable context | Runtime error | Check for null before destructuring |
| Missing loading states | Flash of content / redirects | Always handle `isPending` states |

## TEST COVERAGE GAPS (WHY BUGS WEREN'T CAUGHT)

### What Existing Tests Cover
- ✅ Form rendering (login, signup, org create)
- ✅ Navigation between pages
- ✅ Error message display
- ✅ Protected route redirects (basic)
- ✅ Config error prevention

### What Tests DON'T Cover (Gaps)
- ❌ **Network tab 401 errors** on public pages (no assertion on API calls)
- ❌ **Full user journey**: signup → org create → dashboard → org switcher interaction
- ❌ **Console errors** during normal operation (React warnings)
- ❌ **Organization data appearing in UI** after creation
- ❌ **Dropdown component interactions** (click, switch)
- ❌ **Provider behavior** when session is null

### Required Test Additions

1. **Console Error Assertions** (E2E):
```typescript
test("homepage has no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto("/");
  expect(errors).toHaveLength(0);
});
```

2. **Network 401 Assertions** (E2E):
```typescript
test("unauthenticated homepage makes no auth API calls", async ({ page }) => {
  const authCalls: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("/api/auth")) {
      authCalls.push(req.url());
    }
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // Should not call get-session, list, get-full-organization
  expect(authCalls.filter(u => u.includes("organization"))).toHaveLength(0);
});
```

3. **Full User Journey** (E2E):
```typescript
test("complete signup to dashboard flow", async ({ page }) => {
  // Signup
  await page.goto("/signup");
  await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
  // ... fill form
  await page.click('button[type="submit"]');
  
  // Should land on org/new
  await expect(page).toHaveURL(/\/org\/new/);
  
  // Create org
  await page.fill('[name="name"]', "Test Org");
  await page.click('button[type="submit"]');
  
  // Should land on dashboard with org visible
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.locator('[data-testid="org-switcher"]')).toContainText("Test Org");
});
```

4. **Component Tests for Providers**:
```typescript
describe("OrganizationProvider", () => {
  it("does not call org hooks when session is null", () => {
    // Mock useSession to return null
    // Assert useListOrganizations was NOT called
  });
  
  it("provides null context when unauthenticated", () => {
    const { result } = renderHook(() => useOrganization());
    expect(result.current).toBeNull();
  });
});
```

## WHERE TO ADD NEW TESTS

| Test Type | Location | When to Add |
|-----------|----------|-------------|
| Provider behavior | `tests/components/` | New provider or context changes |
| Full user journey | `e2e/` | New feature with multi-page flow |
| API call verification | `e2e/` | Auth or data-fetching changes |
| Console error checks | `e2e/` | Any component changes |

## CHECKLIST BEFORE MARKING COMPLETE

- [ ] No `router.push()` calls during render phase
- [ ] Provider hooks only called when session exists
- [ ] Context hooks handle null gracefully
- [ ] Loading states for all async operations
- [ ] E2E test covers full user journey
- [ ] No console errors on public pages
- [ ] No 401s for unauthenticated users on public pages
