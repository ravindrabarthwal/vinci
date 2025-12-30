# PROJECT KNOWLEDGE BASE

**Generated:** 2025-12-30T18:37:00+05:30
**Commit:** d7e45f0
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
│   └── lib/              # Utils, auth clients, env validation
├── convex/               # Backend (has own AGENTS.md)
│   ├── auth.ts           # Better Auth integration
│   ├── http.ts           # HTTP router for auth routes
│   └── schema.ts         # Database schema (currently empty)
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

## CONVENTIONS

- **Package manager**: Bun only (`bun run`, `bunx`)
- **Types**: bun-types (not @types/node)
- **Linting**: Biome (tabs, double quotes, semicolons)
- **Path alias**: `@/*` → `src/*`
- **Directory naming**: kebab-case
- **Route groups**: `(public)` for unauth, `(auth)` for protected
- **Test style**: BDD comments `#given/#when/#then`

## ANTI-PATTERNS (THIS PROJECT)

- **npm/yarn**: Use bun exclusively
- **@types/node**: Use bun-types
- **Year 2024**: NEVER use 2024 in code/prompts
- **Rush completion**: Verify before marking done
- **Test Convex with bun**: Use `bun run test:convex` (vitest)
- **Skip env validation**: Always test env errors

## TESTING

```bash
bun test              # Unit + component tests
bun run test:convex   # Convex backend tests (vitest)
bun run test:e2e      # Playwright E2E
bun run test:all      # All suites
```

| Layer | Framework | Location | Environment |
|-------|-----------|----------|-------------|
| Unit | bun:test | `tests/unit/` | Node |
| Component | bun:test + happy-dom | `tests/components/` | JSDOM-like |
| Convex | vitest + convex-test | `convex/*.test.ts` | edge-runtime |
| E2E | Playwright | `e2e/` | Browser (Chrome, Firefox, WebKit) |

## COMMANDS

```bash
bun run dev           # Next.js with Turbopack
bun run dev:convex    # Convex backend dev server
bun run dev:all       # Both in parallel
bun run build         # Production build
bun run lint          # Biome check
bun run lint:fix      # Biome auto-fix
bun run typecheck     # tsc --noEmit
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
| Tooling | Biome (lint + format), TypeScript 5 |

## NOTES

- **Empty schema**: `convex/schema.ts` is placeholder - auth tables managed by better-auth component
- **No middleware**: No global auth middleware yet - handle per-route
- **Convex AGENTS.md**: Contains 700+ lines of Convex-specific guidelines - read it for backend work
- **Env validation**: `src/lib/env.ts` validates at startup - add new vars there
