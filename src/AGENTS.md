### Adding Logging to New Features

**Next.js API Route (Node.js runtime):**
```typescript
import { createLogger } from "@/lib/logging";
import { getTraceIdFromHeaders } from "@/lib/logging/trace";

const logger = createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  logDir: process.env.LOG_DIR ?? ".logs",
  silent: process.env.LOG_SILENT === "true",
});

export async function POST(request: NextRequest) {
  const traceId = getTraceIdFromHeaders(request.headers);
  
  logger.info("Operation started", { traceId, userId, action: "create" });
  
  try {
    // ... your code
    logger.info("Operation completed", { traceId, result: "success" });
  } catch (error) {
    logger.error("Operation failed", {
      traceId,
      error: { name: error.name, message: error.message, stack: error.stack }
    });
    throw error;
  }
}
```