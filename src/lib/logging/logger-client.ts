"use client";

import { getTraceIdFromCookie } from "./trace";
import type { LogContext, Logger, LogLevel } from "./types";

const SERVICE_NAME = "vinci-client";

type ClientLogEntry = {
	level: LogLevel;
	msg: string;
	time: string;
	service: string;
	traceId?: string;
	[key: string]: unknown;
};

function formatLogEntry(level: LogLevel, msg: string, context: LogContext): ClientLogEntry {
	return {
		level,
		msg,
		time: new Date().toISOString(),
		service: SERVICE_NAME,
		traceId: context.traceId ?? getTraceIdFromCookie(),
		...context,
	};
}

function createClientLogMethod(level: LogLevel, bindings: LogContext = {}) {
	return (msg: string, context: LogContext = {}) => {
		const merged = { ...bindings, ...context };
		const entry = formatLogEntry(level, msg, merged);

		switch (level) {
			case "trace":
			case "debug":
				console.debug(JSON.stringify(entry));
				break;
			case "info":
				console.info(JSON.stringify(entry));
				break;
			case "warn":
				console.warn(JSON.stringify(entry));
				break;
			case "error":
			case "fatal":
				console.error(JSON.stringify(entry));
				break;
		}
	};
}

export function createClientLogger(bindings: LogContext = {}): Logger {
	return {
		trace: createClientLogMethod("trace", bindings),
		debug: createClientLogMethod("debug", bindings),
		info: createClientLogMethod("info", bindings),
		warn: createClientLogMethod("warn", bindings),
		error: createClientLogMethod("error", bindings),
		fatal: createClientLogMethod("fatal", bindings),
		child: (childBindings) => createClientLogger({ ...bindings, ...childBindings }),
		flush: () => {},
	};
}

export const clientLogger = createClientLogger();
