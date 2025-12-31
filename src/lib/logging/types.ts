export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export type LogContext = {
	traceId?: string;
	userId?: string;
	requestId?: string;
	path?: string;
	method?: string;
	statusCode?: number;
	durationMs?: number;
	error?: {
		name: string;
		message: string;
		stack?: string;
	};
	[key: string]: unknown;
};

export type LogEntry = {
	level: LogLevel;
	msg: string;
	time: string;
	service: string;
	traceId?: string;
	[key: string]: unknown;
};

export type Logger = {
	trace: (msg: string, context?: LogContext) => void;
	debug: (msg: string, context?: LogContext) => void;
	info: (msg: string, context?: LogContext) => void;
	warn: (msg: string, context?: LogContext) => void;
	error: (msg: string, context?: LogContext) => void;
	fatal: (msg: string, context?: LogContext) => void;
	child: (bindings: LogContext) => Logger;
	flush: () => void;
};
