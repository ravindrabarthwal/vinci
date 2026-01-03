# LOGGING INFRASTRUCTURE

## OVERVIEW

Multi-environment structured logging with Pino. Trace ID correlation across client/server.

## STRUCTURE

| File | Purpose |
|------|---------|
| `logger.ts` | Main factory, `createLogger()`, `createRequestLogger()` |
| `logger-node.ts` | Pino → JSONL files (`.logs/next-*.jsonl`) |
| `logger-client.ts` | Browser → `/api/log` endpoint |
| `logger-edge.ts` | Edge runtime → console JSON |
| `trace.ts` | Server-side trace ID from headers |
| `trace-client.ts` | Client-side trace ID from cookies |
| `global-handlers.ts` | Node.js uncaughtException/unhandledRejection |
| `types.ts` | LogLevel, LogContext, LogEntry, Logger interface |
| `index.ts` | Barrel exports |

## USAGE

### Server-side (API routes, server components)
```typescript
import { createRequestLogger } from "@/lib/logging";

const logger = await createRequestLogger({ level: "info" }, { userId, path });
logger.info("Processing", { method: "POST" });
logger.error("Failed", { error: err.message });
```

### Client-side (React components)
```typescript
import { clientLogger } from "@/lib/logging";

clientLogger.warn("API slow", { endpoint, durationMs });
clientLogger.error("Crash", { error, componentStack });
```

### Edge runtime (middleware)
```typescript
import { edgeLogger } from "@/lib/logging";

edgeLogger.info("Request", { path, method });
```

### Child loggers
```typescript
const reqLogger = logger.child({ requestId: "req-123" });
reqLogger.debug("Step 1"); // includes requestId in all logs
```

## CONFIG

| Env Var | Default | Purpose |
|---------|---------|---------|
| `LOG_LEVEL` | `warn` | Minimum level to log |
| `LOG_DIR` | `.logs` | Directory for JSONL files |
| `LOG_SILENT` | `false` | Suppress all output |

## INITIALIZATION

- **Node.js**: Auto-initialized in `src/instrumentation.ts`
- **Client**: Via `ErrorHandlerProvider` in root layout
- **Edge**: No init needed, import and use

## LOG LEVELS

`trace` < `debug` < `info` < `warn` < `error` < `fatal`

## TRACE ID FLOW

1. Client generates UUID → `vinci_trace_id` cookie
2. Requests include cookie → server extracts
3. All logs include `traceId` for correlation
4. Header: `x-trace-id`, Cookie: `vinci_trace_id`

## ANTI-PATTERNS

- **Never** use bare `console.log` (use appropriate logger)
- **Never** log sensitive data (passwords, tokens)
- **Never** forget traceId in request handlers
