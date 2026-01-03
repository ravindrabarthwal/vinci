# VINCI PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-02
**Commit:** cb8772a
**Branch:** fix/testing-infra

## OVERVIEW

Next.js 16 + Convex backend + Better Auth authentication. Multi-tenant org support. Bun runtime.

## STRUCTURE

```
vinci/
├── convex/           # Backend: Convex functions, schema, auth (see convex/AGENTS.md)
├── e2e/              # E2E tests with Playwright (see e2e/AGENTS.md)
├── src/
│   ├── app/          # Next.js App Router pages
│   │   ├── (auth)/   # Protected routes (dashboard, org management)
│   │   ├── (public)/ # Public routes (login, signup, invite)
│   │   └── api/      # API routes (auth catch-all, log endpoint)
│   ├── components/   # React components (UI from shadcn, providers, sidebar)
│   ├── lib/          # Shared utilities (auth, logging, env)
│   │   └── logging/  # Multi-env logging system (see src/lib/logging/AGENTS.md)
│   └── hooks/        # React hooks
├── tests/            # Unit tests (Bun test)
├── scripts/          # Build scripts (convex log router)
└── public/           # Static assets
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add page | `src/app/` | Use route groups: `(auth)/` for protected, `(public)/` for public |
| Add API route | `src/app/api/` | `route.ts` with GET/POST exports |
| Add Convex function | `convex/` | Use model layer pattern (see convex/AGENTS.md) |
| Add UI component | `src/components/ui/` | shadcn pattern, use `cn()` for classes |
| Add provider | `src/components/providers/` | Wrap in root layout |
| Auth client hooks | `src/lib/auth-client.ts` | `authClient.useSession()`, `signIn()`, `signOut()` |
| Auth server | `src/lib/auth-server.ts` | `auth.api.getSession()` |
| Logging | `src/lib/logging/` | Environment-specific loggers |
| Environment vars | `src/lib/env.ts` | Validated via Zod schema |

## CONVENTIONS

### Code Style (Biome)
- **Tabs** with 2-space width, 100 char line width
- **Double quotes**, always semicolons
- Unused imports/vars = error
- `noExplicitAny` = warn (avoid `as any`)

### TypeScript (Strict)
- `noUncheckedIndexedAccess` enabled - handle undefined from array/object access
- `noImplicitReturns` - all code paths must return
- Path alias: `@/*` → `src/*`

### Testing (Three Tiers)
- **Unit tests**: `tests/unit/*.test.ts` → Bun test (pure logic, utilities)
- **Convex tests**: `convex/*.test.ts` → Vitest in edge-runtime (backend) — **SEE `convex/TESTING.md`**
- **E2E tests**: `e2e/` → Playwright (see e2e/AGENTS.md)

#### ⚠️ MANDATORY Test Style Rules:
| Test Type | Style | Example |
|-----------|-------|---------|
| **Convex tests** | `describe`/`test` blocks with descriptive names | `test("returns empty array when no orgs exist")` |
| **Unit tests** | `#given #when #then` comments inside test body | `// #given user is logged in` |
| **E2E tests** | User journey pattern (NOT BDD fragments) | see `e2e/AGENTS.md` |

**CRITICAL**: Convex tests MUST use standard Vitest `describe`/`test` patterns. Do NOT use `#given #when #then` comments in Convex tests — this is NOT the Convex-recommended style.

### Auth Flow
- Client: `authClient` from `@/lib/auth-client` (React hooks)
- Server: `auth` from `@/lib/auth-server` (API routes)
- Backend: `getAuthenticatedUser()` from `convex/model/auth`
- Sessions stored in Convex via betterAuth component

### Logging
- Node: Pino → `.logs/next-YYYY-MM-DD.jsonl`
- Client: Console → `/api/log` (dev only)
- Edge: JSON to console
- Always include `traceId` in context

## COMMANDS

```bash
# Development
bun run dev:all          # Start Next.js + Convex concurrently

# Testing
bun run test             # Unit tests (Bun)
bun run test:convex      # Convex tests (Vitest)
bun run test:e2e         # E2E tests (Playwright)
bun run test:all         # All tests

# Code quality
bun run lint:fix         # Biome lint + fix
bun run format           # Biome format
bun run typecheck        # TypeScript check

# Utilities
bun run logs:tail:next   # Tail Next.js logs with pino-pretty
bun run kill:all         # Kill dev server ports
```

## ANTI-PATTERNS

- **Never** suppress types with `as any`, `@ts-ignore`
- **Never** commit `.env` files (use `.env.example`)
- **Never** import from `convex/_generated` directly in components (use hooks)
- **Never** use bare `console.log` in production code (use logging system)

## NOTES

- **Sisyphus Agent**: AI agent workflow in `.github/workflows/sisyphus-agent.yml` - responds to `@sisyphus-agent` mentions
- **Schema location**: Tables defined in `convex/betterAuth/schema.ts`, not root `convex/schema.ts`
- **Organization support**: Multi-tenant via Better Auth organization plugin
- **Turbopack**: Enabled for dev (`next dev --turbopack`)
