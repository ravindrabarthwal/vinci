# PROJECT KNOWLEDGE BASE

**Generated:** 2025-12-30T19:26:00+09:00
**Commit:** none
**Branch:** main

## CONVENTIONS

- **Package manager**: Bun only (`bun run`, `bun build`, `bunx`)
- **Types**: bun-types (not @types/node)
- **Build**: Dual output - `bun build` (ESM) + `tsc --emitDeclarationOnly`
- **Exports**: Barrel pattern - `export * from "./module"` in index.ts
- **Directory naming**: kebab-case (`ast-grep/`, `claude-code-hooks/`)
- **Test style**: BDD comments `#given`, `#when`, `#then` (same as AAA)

## ANTI-PATTERNS (THIS PROJECT)

- **npm/yarn**: Use bun exclusively
- **@types/node**: Use bun-types
- **Bash file ops**: Never mkdir/touch/rm/cp/mv for file creation in code
- **Year 2024**: NEVER use 2024 in code/prompts (use current year)
- **Rush completion**: Never mark tasks complete without verification
- **Over-exploration**: Stop searching when sufficient context found

## TESTING GUIDELINES (Next.js + Convex)

### Unit Tests (`bun test` in `tests/`)
- DO test utility functions, helpers, and pure logic in `tests/unit/`
- DO test React components with happy-dom in `tests/components/`
- DO test env validation logic to catch missing config early
- DO NOT test Convex functions with bun test (use vitest instead)

### Convex Tests (`bun run test:convex` with vitest in `convex/*.test.ts`)
- DO test that required env vars throw descriptive errors when missing
- DO test Convex queries, mutations, and actions with `convex-test`
- DO test auth module initialization and configuration
- DO NOT skip env validation tests - they catch deployment misconfigs

### E2E Tests (`bun run test:e2e` with Playwright in `e2e/`)
- DO test actual form submissions, not just UI visibility
- DO verify API responses don't contain config errors (500s with secret/env messages)
- DO test auth flows end-to-end: signup → login → protected route → logout
- DO test that unauthenticated users are redirected from protected routes
- DO use specific selectors (e.g., `div[class*="bg-destructive"]`) not generic ones
- DO NOT assume UI rendering means backend is configured correctly
- DO NOT write tests that only check element visibility without exercising functionality

### General Testing Rules
- DO run all test suites before marking feature complete: `bun test && bun run test:convex && bun run test:e2e`
- DO add startup validation for required env vars in `src/lib/env.ts`
- DO test error paths, not just happy paths
- DO NOT trust that "it renders" means "it works"

## NOTES

- **Testing**: Bun native test (`bun test`), BDD-style `#given/#when/#then`