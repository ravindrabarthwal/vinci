import type { LogContext, Logger } from "./types";

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

function createLogMethod(level: LogLevel, bindings: LogContext) {
	return (msg: string, context: LogContext = {}) => {
		const merged = { ...bindings, ...context };
		const output = JSON.stringify(formatLog(level, msg, merged));

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

export function createEdgeLogger(bindings: LogContext = {}): Logger {
	return {
		trace: createLogMethod("trace", bindings),
		debug: createLogMethod("debug", bindings),
		info: createLogMethod("info", bindings),
		warn: createLogMethod("warn", bindings),
		error: createLogMethod("error", bindings),
		fatal: createLogMethod("fatal", bindings),
		child: (childBindings) => createEdgeLogger({ ...bindings, ...childBindings }),
		flush: () => {},
	};
}

export const edgeLogger = createEdgeLogger();

export type EdgeLogger = Logger;
