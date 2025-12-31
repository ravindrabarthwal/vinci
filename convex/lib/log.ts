type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

type LogContext = {
	traceId?: string;
	[key: string]: unknown;
};

type ConvexLogEntry = {
	marker: string;
	level: LogLevel;
	msg: string;
	time: number;
	service: string;
	traceId?: string;
	[key: string]: unknown;
};

type ConvexLogger = {
	trace: (msg: string, context?: LogContext) => void;
	debug: (msg: string, context?: LogContext) => void;
	info: (msg: string, context?: LogContext) => void;
	warn: (msg: string, context?: LogContext) => void;
	error: (msg: string, context?: LogContext) => void;
	fatal: (msg: string, context?: LogContext) => void;
};

export const LOG_MARKER = "__VINCI_LOG__";
const SERVICE_NAME = "vinci-convex";

function formatLog(level: LogLevel, msg: string, context: LogContext): ConvexLogEntry {
	return {
		marker: LOG_MARKER,
		level,
		msg,
		time: Date.now(),
		service: SERVICE_NAME,
		...context,
	};
}

function createLogMethod(level: LogLevel, bindings: LogContext) {
	return (msg: string, context: LogContext = {}) => {
		const merged = { ...bindings, ...context };
		const output = JSON.stringify(formatLog(level, msg, merged));

		switch (level) {
			case "trace":
			case "debug":
			case "info":
				break;
			case "warn":
				console.warn(output);
				break;
			case "error":
			case "fatal":
				console.error(output);
				break;
		}
	};
}

export function createConvexLogger(bindings: LogContext = {}): ConvexLogger {
	return {
		trace: createLogMethod("trace", bindings),
		debug: createLogMethod("debug", bindings),
		info: createLogMethod("info", bindings),
		warn: createLogMethod("warn", bindings),
		error: createLogMethod("error", bindings),
		fatal: createLogMethod("fatal", bindings),
	};
}

export function convexLog(level: LogLevel, msg: string, context: LogContext = {}): void {
	const logger = createConvexLogger(context);
	logger[level](msg);
}

export type { LogLevel, LogContext, ConvexLogger, ConvexLogEntry };
