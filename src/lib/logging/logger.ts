import { getNodeLogger, type LoggerNodeConfig } from "./logger-node";
import { getTraceId } from "./trace";
import type { LogContext, Logger, LogLevel } from "./types";

function createLogMethod(
	pinoLogger: ReturnType<typeof getNodeLogger>,
	level: LogLevel,
	bindings: LogContext = {},
) {
	return (msg: string, context: LogContext = {}) => {
		const merged = { ...bindings, ...context };
		pinoLogger[level](merged, msg);
	};
}

export function createLogger(config: LoggerNodeConfig, bindings: LogContext = {}): Logger {
	const pinoLogger = getNodeLogger(config);

	return {
		trace: createLogMethod(pinoLogger, "trace", bindings),
		debug: createLogMethod(pinoLogger, "debug", bindings),
		info: createLogMethod(pinoLogger, "info", bindings),
		warn: createLogMethod(pinoLogger, "warn", bindings),
		error: createLogMethod(pinoLogger, "error", bindings),
		fatal: createLogMethod(pinoLogger, "fatal", bindings),
		child: (childBindings) => createLogger(config, { ...bindings, ...childBindings }),
		flush: () => pinoLogger.flush(),
	};
}

export async function createRequestLogger(
	config: LoggerNodeConfig,
	additionalContext: LogContext = {},
): Promise<Logger> {
	const traceId = await getTraceId();
	return createLogger(config, { traceId, ...additionalContext });
}

let defaultLogger: Logger | null = null;

export function getLogger(config: LoggerNodeConfig): Logger {
	if (!defaultLogger) {
		defaultLogger = createLogger(config);
	}
	return defaultLogger;
}

export function resetLogger(): void {
	defaultLogger = null;
}
