import { getNodeLogger, type LoggerNodeConfig } from "./logger-node";

let initialized = false;
let originalConsoleError: typeof console.error | null = null;
let originalConsoleWarn: typeof console.warn | null = null;

function getDefaultConfig(): LoggerNodeConfig {
	return {
		level: process.env.LOG_LEVEL ?? "warn",
		logDir: process.env.LOG_DIR ?? ".logs",
		silent: process.env.LOG_SILENT === "true",
	};
}

function formatError(error: unknown): { name: string; message: string; stack?: string } {
	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
			stack: error.stack,
		};
	}
	return {
		name: "Unknown",
		message: String(error),
	};
}

function formatArgs(args: unknown[]): string {
	return args
		.map((arg) => {
			if (arg instanceof Error) {
				const stackTrace = arg.stack ? `\n${arg.stack}` : "";
				return `${arg.name}: ${arg.message}${stackTrace}`;
			}
			if (typeof arg === "object") {
				try {
					return JSON.stringify(arg);
				} catch {
					return String(arg);
				}
			}
			return String(arg);
		})
		.join(" ");
}

export function initGlobalErrorHandlers(config?: LoggerNodeConfig): void {
	if (initialized) {
		return;
	}

	const isBrowser = typeof window !== "undefined" && typeof process === "undefined";
	if (isBrowser) {
		return;
	}

	const loggerConfig = config ?? getDefaultConfig();
	const logger = getNodeLogger(loggerConfig);

	process.on("uncaughtException", (error: Error, origin: string) => {
		logger.fatal(
			{
				type: "uncaughtException",
				origin,
				error: formatError(error),
			},
			"Uncaught Exception",
		);
		logger.flush();
	});

	process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
		logger.error(
			{
				type: "unhandledRejection",
				error: formatError(reason),
				promise: String(promise),
			},
			"Unhandled Promise Rejection",
		);
		logger.flush();
	});

	originalConsoleError = console.error;
	console.error = (...args: unknown[]) => {
		const message = formatArgs(args);
		const errorArg = args.find((arg) => arg instanceof Error);

		logger.error(
			{
				type: "console.error",
				error: errorArg ? formatError(errorArg) : undefined,
			},
			message,
		);

		originalConsoleError?.apply(console, args);
	};

	originalConsoleWarn = console.warn;
	console.warn = (...args: unknown[]) => {
		const message = formatArgs(args);

		logger.warn(
			{
				type: "console.warn",
			},
			message,
		);

		originalConsoleWarn?.apply(console, args);
	};

	initialized = true;
}

export function resetGlobalErrorHandlers(): void {
	if (originalConsoleError) {
		console.error = originalConsoleError;
		originalConsoleError = null;
	}
	if (originalConsoleWarn) {
		console.warn = originalConsoleWarn;
		originalConsoleWarn = null;
	}
	initialized = false;
}

export function isGlobalHandlersInitialized(): boolean {
	return initialized;
}
