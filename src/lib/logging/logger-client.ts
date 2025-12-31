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
	url?: string;
	userAgent?: string;
	error?: {
		name: string;
		message: string;
		stack?: string;
	};
	[key: string]: unknown;
};

function formatError(error: unknown): ClientLogEntry["error"] | undefined {
	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
			stack: error.stack,
		};
	}
	if (error && typeof error === "object" && "message" in error) {
		return {
			name: "Error",
			message: String(error.message),
		};
	}
	return undefined;
}

function formatLogEntry(level: LogLevel, msg: string, context: LogContext): ClientLogEntry {
	const errorObj = context.error ? formatError(context.error) : undefined;
	const { error: _, ...restContext } = context;

	return {
		level,
		msg,
		time: new Date().toISOString(),
		service: SERVICE_NAME,
		traceId: context.traceId ?? getTraceIdFromCookie(),
		url: typeof window !== "undefined" ? window.location.href : undefined,
		userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
		error: errorObj,
		...restContext,
	};
}

function sendToServer(entry: ClientLogEntry): void {
	if (typeof fetch === "undefined") return;

	fetch("/api/log", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(entry),
	}).catch(() => {});
}

function createClientLogMethod(level: LogLevel, bindings: LogContext = {}) {
	return (msg: string, context: LogContext = {}) => {
		const merged = { ...bindings, ...context };
		const entry = formatLogEntry(level, msg, merged);

		switch (level) {
			case "trace":
			case "debug":
			case "info":
				console.debug(JSON.stringify(entry));
				break;
			case "warn":
				console.warn(JSON.stringify(entry));
				sendToServer(entry);
				break;
			case "error":
			case "fatal":
				console.error(JSON.stringify(entry));
				sendToServer(entry);
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

let globalErrorHandlersInitialized = false;

export function initClientErrorHandlers(): void {
	if (globalErrorHandlersInitialized) return;
	if (typeof window === "undefined") return;

	window.addEventListener("error", (event) => {
		clientLogger.error("Uncaught error", {
			error: event.error,
			filename: event.filename,
			lineno: event.lineno,
			colno: event.colno,
		});
	});

	window.addEventListener("unhandledrejection", (event) => {
		clientLogger.error("Unhandled promise rejection", {
			error: event.reason,
		});
	});

	globalErrorHandlersInitialized = true;
}
