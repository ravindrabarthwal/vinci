import type { LogContext } from "./types";

type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

type EdgeLogEntry = {
	level: LogLevel;
	msg: string;
	time: string;
	service: string;
	runtime: "edge";
	[key: string]: unknown;
};

const SERVICE_NAME = "vinci-edge";

function formatLog(level: LogLevel, msg: string, context: LogContext): EdgeLogEntry {
	return {
		level,
		msg,
		time: new Date().toISOString(),
		service: SERVICE_NAME,
		runtime: "edge",
		...context,
	};
}

function createLogMethod(level: LogLevel) {
	return (msg: string, context: LogContext = {}) => {
		const output = JSON.stringify(formatLog(level, msg, context));

		switch (level) {
			case "trace":
			case "debug":
				console.debug(output);
				break;
			case "info":
				console.info(output);
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

export type EdgeLogger = {
	trace: (msg: string, context?: LogContext) => void;
	debug: (msg: string, context?: LogContext) => void;
	info: (msg: string, context?: LogContext) => void;
	warn: (msg: string, context?: LogContext) => void;
	error: (msg: string, context?: LogContext) => void;
	fatal: (msg: string, context?: LogContext) => void;
};

export function createEdgeLogger(): EdgeLogger {
	return {
		trace: createLogMethod("trace"),
		debug: createLogMethod("debug"),
		info: createLogMethod("info"),
		warn: createLogMethod("warn"),
		error: createLogMethod("error"),
		fatal: createLogMethod("fatal"),
	};
}

export const edgeLogger = createEdgeLogger();
