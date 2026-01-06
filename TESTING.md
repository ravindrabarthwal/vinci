# TESTING GUIDE

## Overview

This project uses a 3-tier testing strategy:
1. **Unit Tests** (Bun Test): Fast, pure logic tests.
2. **Convex Tests** (Vitest): Backend function integration tests.
3. **E2E Tests** (Playwright): Full browser user journey tests.

## Running Tests

### Unit Tests
Run fast unit tests for utility functions and pure logic:
```bash
bun run test
bun run test:watch  # Watch mode
```

### Convex Tests
Run backend integration tests:
```bash
bun run test:convex
```

### E2E Tests
Run full end-to-end tests in headless mode:
```bash
bun run test:e2e
```

Run with UI for debugging:
```bash
bun run test:e2e:ui
```

## Sisyphus Agent Self-Healing

The Sisyphus Agent (v2) includes a self-healing loop for CI failures.

### How it works
1. **Plan Phase**: Agent receives a request, plans changes, and commits them.
2. **Verify Phase 1**: CI runs tests. If they pass, the workflow ends.
3. **Fix Phase**: If tests fail, the agent analyzes the failure logs, attempts to fix the code, and commits the fix.
4. **Verify Phase 2**: CI runs tests again on the fixed code.

### Triggering Self-Healing manually
1. Create a PR with a known failing test.
2. Comment `@sisyphus-agent fix this please`.
3. Watch the workflow:
   - It will fail the first verification.
   - It will enter "Fix (Phase 1)".
   - It will commit a fix.
   - It will pass "Verify (Phase 2)".

## Troubleshooting E2E Tests

If E2E tests are failing locally:
1. Ensure no other instances are running: `bun run kill:all`
2. Check `playwright.config.ts` timeout settings.
3. If getting `403` or rate limits from GitHub during `convex dev`, ensure you are authenticated or use a fresh IP/token.

## Writing Tests

### Unit Tests (`tests/unit/*.test.ts`)
- Use `#given #when #then` comments for structure.
- Keep them fast and isolated.

### Convex Tests (`convex/*.test.ts`)
- Use `describe`/`test` blocks.
- **Do NOT** use `#given #when #then` comments (Convex style).

### E2E Tests (`e2e/**/*.spec.ts`)
- Write complete user journeys (e.g., "signup and create org").
- Avoid fragmented BDD steps that depend on shared state.
