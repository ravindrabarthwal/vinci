# CONVEX TESTING GUIDE

## OVERVIEW

This project uses `convex-test` with Vitest for testing Convex functions. Tests run in `edge-runtime` environment to match Convex's production runtime.

## QUICK START

```bash
bun run test:convex        # Run all Convex tests
bun run test:convex:watch  # Watch mode
```

## TEST STRUCTURE

```
convex/
├── *.test.ts              # Test files (co-located with functions)
├── test.setup.ts          # Vitest setup + modules glob
├── lib/*.test.ts          # Library tests
└── model/*.test.ts        # Model layer tests
```

## CORE PATTERNS

### 1. Basic Test Setup

```typescript
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./betterAuth/schema";
import { modules } from "./test.setup";

test("my test", async () => {
  const t = convexTest(schema, modules);
  // Use t.query(), t.mutation(), t.action(), t.run()
});
```

**IMPORTANT**: Always pass `schema` for validation and `modules` for function discovery.

### 2. Direct Database Access with `t.run`

Use `t.run()` to directly manipulate the database without needing dedicated Convex functions:

```typescript
test("database operations", async () => {
  const t = convexTest(schema, modules);

  // Insert data
  await t.run(async (ctx) => {
    await ctx.db.insert("user", {
      name: "Test User",
      email: "test@example.com",
      emailVerified: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  // Query data
  const users = await t.run(async (ctx) => {
    return await ctx.db.query("user").collect();
  });

  expect(users).toHaveLength(1);
});
```

### 3. Calling Convex Functions

```typescript
import { api, internal } from "./_generated/api";

test("calling functions", async () => {
  const t = convexTest(schema, modules);

  // Public queries/mutations
  const result = await t.query(api.organizations.listUserOrganizations);
  await t.mutation(api.myModule.myMutation, { arg: "value" });

  // Internal functions
  await t.mutation(internal.myModule.internalMutation, { arg: "value" });

  // Actions
  await t.action(api.myModule.myAction, { arg: "value" });
});
```

### 4. Authentication Testing

```typescript
test("authenticated operations", async () => {
  const t = convexTest(schema, modules);

  // Create authenticated context
  const asSarah = t.withIdentity({ name: "Sarah" });

  // Access identity in test
  const identity = await asSarah.run(async (ctx) => {
    return await ctx.auth.getUserIdentity();
  });

  expect(identity!.name).toBe("Sarah");
  expect(identity!.tokenIdentifier).toBeTypeOf("string"); // Auto-generated
});
```

**Multi-user testing**:

```typescript
test("isolated user data", async () => {
  const t = convexTest(schema, modules);

  const asSarah = t.withIdentity({ name: "Sarah", subject: "sarah-id" });
  const asLee = t.withIdentity({ name: "Lee", subject: "lee-id" });

  // Each identity has separate context
  await asSarah.mutation(api.tasks.create, { text: "Sarah's task" });
  await asLee.mutation(api.tasks.create, { text: "Lee's task" });

  const sarahsTasks = await asSarah.query(api.tasks.list);
  const leesTasks = await asLee.query(api.tasks.list);

  // Each sees only their own data (if function is scoped to user)
});
```

### 5. Testing Scheduled Functions

```typescript
import { vi } from "vitest";

test("scheduled functions", async () => {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);

  // Schedule a function
  await t.mutation(api.scheduler.scheduleAction, { delayMs: 10000 });

  // Advance time past scheduled time
  vi.runAllTimers();

  // Wait for scheduled function to complete
  await t.finishInProgressScheduledFunctions();

  // Verify results
  const result = await t.query(api.scheduler.getResult);
  expect(result).toMatchObject({ status: "completed" });

  vi.useRealTimers();
});
```

### 6. Mocking External APIs

```typescript
test("action with external API", async () => {
  const t = convexTest(schema, modules);

  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      text: async () => "mocked response",
    }) as Response),
  );

  const result = await t.action(api.ai.generateResponse, { prompt: "hello" });
  expect(result).toBe("mocked response");

  vi.unstubAllGlobals();
});
```

### 7. Error Assertions

```typescript
test("validation errors", async () => {
  const t = convexTest(schema, modules);

  await expect(async () => {
    await t.mutation(api.messages.send, { body: "" }); // Empty body not allowed
  }).rejects.toThrowError("Empty message body is not allowed");
});
```

## ASSERTION PATTERNS

```typescript
// Partial matching (recommended for objects with system fields)
expect(result).toMatchObject({ name: "Test", status: "active" });

// Exact matching
expect(result).toEqual([]);

// Length check
expect(results).toHaveLength(3);

// Type check
expect(value).toBeTypeOf("string");
```

## TEST ORGANIZATION

### Good: Co-located tests

```
convex/
├── organizations.ts
├── organizations.test.ts  # Tests for organizations.ts
├── model/
│   ├── auth.ts
│   └── auth.test.ts       # Tests for auth model
```

### Good: Descriptive test names

```typescript
test("returns empty array when user has no organizations", async () => {});
test("returns all user organizations sorted by creation date", async () => {});
```

## CURRENT TESTS VS RECOMMENDED PATTERNS

| Current Pattern | Recommended Pattern |
|----------------|---------------------|
| `#given #when #then` comments | Optional - Convex docs use plain test names |
| Module import testing only | Add `convex-test` for function logic tests |
| No `t.run()` usage | Use `t.run()` for setup and assertions |
| No `t.withIdentity()` | Use for auth-dependent function tests |

## WHAT TO TEST

### SHOULD Test:
- Business logic in queries/mutations
- Data validation and schema enforcement
- Authorization rules (who can access what)
- Edge cases (empty inputs, null values)
- Index queries working correctly

### SHOULD NOT Test:
- BetterAuth internals (external library)
- Convex runtime behavior (trust the platform)
- Simple getter/setter functions with no logic

## LIMITATIONS

`convex-test` is a mock, not the real backend:

| Feature | Limitation |
|---------|------------|
| Error messages | May differ from production |
| Limits | Size/time limits NOT enforced |
| Text search | Simplified (no relevance sorting) |
| Vector search | No vector index optimization |
| Cron jobs | NOT supported - trigger manually |

For integration testing with real backend, see: https://docs.convex.dev/testing/convex-backend

## REFERENCES

- Official Docs: https://docs.convex.dev/testing/convex-test
- convex-test GitHub: https://github.com/get-convex/convex-test
- Example Tests: https://github.com/get-convex/convex-test/tree/main/convex
- Vitest Docs: https://vitest.dev/guide/
