# PROJECT KNOWLEDGE BASE

**Generated:** 2025-12-31
**Branch:** main

## OVERVIEW

Vinci - Next.js 16 + Convex backend with Better Auth. Email/password authentication, route groups for public/protected pages.

## STRUCTURE

```
vinci/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (public)/     # Login, Signup (unauthenticated)
│   │   ├── (auth)/       # Dashboard (authenticated)
│   │   └── api/auth/     # Auth API route handler
│   ├── components/
│   │   ├── ui/           # Shadcn-style components
│   │   └── providers/    # ConvexClientProvider
│   └── lib/
│       ├── logging/      # Logging infrastructure (see LOGGING section)
│       └── ...           # Utils, auth clients, env validation
├── convex/               # Backend (has own AGENTS.md)
│   ├── lib/log.ts        # Convex logger
│   ├── auth.ts           # Better Auth integration
│   ├── http.ts           # HTTP router for auth routes
│   └── schema.ts         # Database schema
├── scripts/              # Dev tooling
│   └── convex-log-router.ts  # Captures Convex logs to files
├── .logs/                # Log files (gitignored)
├── tests/                # Unit + component tests (bun test)
├── e2e/                  # Playwright E2E tests
└── biome.json            # Linter/formatter config
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add protected page | `src/app/(auth)/` | Uses route group for auth layout |
| Add public page | `src/app/(public)/` | No auth required |
| Add API endpoint | `src/app/api/` or `convex/` | Use Convex for DB ops |
| Add UI component | `src/components/ui/` | Shadcn pattern |
| Add Convex function | `convex/` | See `convex/AGENTS.md` |
| Configure env vars | `src/lib/env.ts` | Startup validation |
| Auth client hooks | `src/lib/auth-client.ts` | signIn, signUp, useSession |
| Auth server utils | `src/lib/auth-server.ts` | isAuthenticated, getToken |
| Add logging | `src/lib/logging/` | See LOGGING section below |

## CONVENTIONS

- **Package manager**: Bun only (`bun run`, `bunx`)
- **Types**: bun-types (not @types/node)
- **Linting**: Biome (tabs, double quotes, semicolons)
- **Path alias**: `@/*` → `src/*`
- **Directory naming**: kebab-case
- **Route groups**: `(public)` for unauth, `(auth)` for protected
- **Test style**: BDD comments `#given/#when/#then`

## ANTI-PATTERNS (THIS PROJECT)

- **npm/yarn/npx**: Use bun exclusively
- **@types/node**: Use bun-types
- **Year 2024**: NEVER use 2024 in code/prompts
- **Rush completion**: Verify before marking done
- **Test Convex with bun**: Use `bun run test:convex` (vitest)
- **Skip env validation**: Always test env errors

---

## LOGGING (FOR AI AGENTS)

Structured logging to `.logs/` directory for debugging. **Use this to verify feature completion and debug issues.**

### Log Files

| File | Source | Format |
|------|--------|--------|
| `.logs/next-YYYY-MM-DD.jsonl` | Next.js API routes | JSONL (Pino) |
| `.logs/convex-YYYY-MM-DD.jsonl` | Convex functions | JSONL (via log router) |

### Reading Logs for Debugging

```bash
# View Next.js logs (formatted)
cat .logs/next-*.jsonl | jq '.'

# View Convex logs
cat .logs/convex-*.jsonl | jq '.'

# Filter by trace ID
cat .logs/next-*.jsonl | jq 'select(.traceId == "abc-123")'

# Filter errors only
cat .logs/next-*.jsonl | jq 'select(.level == "error")'

# Tail logs in real-time
bun run logs:tail:next
bun run logs:tail:convex
```

### Verifying Feature Completion via Logs

1. **Start servers with logging**: `bun run dev:all` (uses log router for Convex)
2. **Trigger the feature** (via curl, browser, or E2E test)
3. **Read logs** to verify:
   - Request reached the endpoint (check `path`)
   - Operation completed successfully (check `level: "info"` with completion message)
   - No errors (check `level: "error"`)
   - Response status is correct (check `statusCode`)

**Example verification:**
```bash
# After triggering login
cat .logs/next-*.jsonl | jq 'select(.path == "/api/auth/sign-in/email")'

# Expected: info "Auth request started", info "Auth request completed" with statusCode 200
# If error: error "Auth request error" with error details
```

---

## TESTING

### Commands

```bash
bun test              # Unit + component tests
bun run test:convex   # Convex backend tests (vitest)
bun run test:e2e      # Playwright E2E
bun run test:all      # All suites
```

### Test Locations

| Layer | Framework | Location | Environment |
|-------|-----------|----------|-------------|
| Unit | bun:test | `tests/unit/` | Node |
| Component | bun:test + happy-dom | `tests/components/` | JSDOM-like |
| Convex | vitest + convex-test | `convex/*.test.ts` | edge-runtime |
| E2E | Playwright | `e2e/` | Browser (Chrome, Firefox, WebKit) |

### Test Style (BDD Comments)

```typescript
it("#given X #when Y #then Z", () => {
  // #given - setup
  const input = "test";
  
  // #when - action
  const result = myFunction(input);
  
  // #then - assertion
  expect(result).toBe("expected");
});
```

---

## DEVELOPMENT WORKFLOW

### Creating a New Feature

**ALWAYS treat tests are first class citizen. NEVER keep test optional**
1. **Understand scope**: Read existing code in target location
2. **Add logging**: Include structured logs at entry/exit/error points
3. **ALWAYS Write tests first** (if applicable): Unit tests for logic, E2E for user flows, convex tests
4. **Implement feature**
5. **Verify via logs**: Start servers, trigger feature, read `.logs/` files
6. **Run all checks**:
   ```bash
   bun run lint && bun run typecheck && bun test && bun run test:convex
   ```

### Refactoring / Enhancement Checklist

**ALWAYS treat tests are first class citizen. NEVER keep test optional**
Before marking complete, **ALL must pass - NO EXCEPTIONS:**

```bash
# 1. Linting (auto-fix first)
bun run lint:fix
bun run lint          # Must exit 0

# 2. Type checking
bun run typecheck     # Must exit 0

# 3. Unit + Component tests
bun test              # All tests pass

# 4. Convex tests
bun run test:convex   # All tests pass

# 5. E2E tests
bun run test:e2e      # All tests pass
```

**If tests fail after your changes:**
- Fix the code to make tests pass, OR
- Update tests if behavior intentionally changed (document why)

**NEVER skip failing tests. NEVER delete tests to make them pass. NEVER skips any test**

### Verification Checklist (Before Completion)

**ALL boxes must be checked - NO EXCEPTIONS:**

- [ ] `bun run lint` passes
- [ ] `bun run typecheck` passes
- [ ] `bun test` passes (unit + component)
- [ ] `bun run test:convex` passes
- [ ] `bun run test:e2e`
- [ ] Feature works manually (verified via logs or browser)
- [ ] No `level: "error"` in `.logs/` during happy path

**If you modified a Critical Infrastructure File, you MUST run `bun run test:all` before marking complete.**

---

## COMMANDS

```bash
# Development
bun run dev           # Next.js with Turbopack
bun run dev:convex    # Convex with log capture to .logs/
bun run dev:convex:raw # Convex without log capture
bun run dev:all       # Both in parallel

# Build
bun run build         # Production build

# Quality
bun run lint          # Biome check
bun run lint:fix      # Biome auto-fix
bun run typecheck     # tsc --noEmit

# Testing
bun test              # Unit + component
bun run test:convex   # Convex tests
bun run test:e2e      # Playwright E2E
bun run test:all      # All suites

# Logs
bun run logs:clear        # Clear all log files
bun run logs:tail:next    # Tail Next.js logs (pino-pretty)
bun run logs:tail:convex  # Tail Convex logs
```

## TECH STACK

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1.1 (App Router, Turbopack) |
| Backend | Convex 1.31.2 |
| Auth | better-auth 1.4.9 + @convex-dev/better-auth |
| Styling | Tailwind CSS v4 |
| UI | Radix primitives, Shadcn pattern |
| Testing | bun:test, vitest, Playwright |
| Logging | Pino (Next.js), structured console (Convex) |
| Tooling | Biome (lint + format), TypeScript 5 |

## NOTES

- **Proxy**: `src/proxy.ts` injects trace IDs for request correlation (Next.js 16+ uses proxy instead of middleware)
- **Convex AGENTS.md**: Contains Convex-specific guidelines - read it for backend work
- **Env validation**: `src/lib/env.ts` validates at startup - add new vars there
- **Log files**: `.logs/` is gitignored - logs are for local dev debugging only
