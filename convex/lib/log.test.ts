import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexLog, createConvexLogger, LOG_MARKER } from "./log";

describe("Convex Logger", () => {
	let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
	let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
	let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
		consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
		consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("createConvexLogger", () => {
		it("#given createConvexLogger called #when info logged #then outputs JSON with LOG_MARKER", () => {
			// #given - create logger
			const logger = createConvexLogger();

			// #when - log info message
			logger.info("Test message");

			// #then - console.info called with JSON containing marker
			expect(consoleInfoSpy).toHaveBeenCalledOnce();
			const output = JSON.parse(consoleInfoSpy.mock.calls[0][0] as string);
			expect(output.marker).toBe(LOG_MARKER);
			expect(output.msg).toBe("Test message");
			expect(output.level).toBe("info");
			expect(output.service).toBe("vinci-convex");
		});

		it("#given logger with bindings #when logged #then includes bindings in output", () => {
			// #given - logger with traceId binding
			const logger = createConvexLogger({ traceId: "trace-123" });

			// #when - log message
			logger.info("Request processed");

			// #then - output includes binding
			const output = JSON.parse(consoleInfoSpy.mock.calls[0][0] as string);
			expect(output.traceId).toBe("trace-123");
		});

		it("#given logger #when context passed to log method #then merges with bindings", () => {
			// #given - logger with userId binding
			const logger = createConvexLogger({ userId: "user-1" });

			// #when - log with additional context
			logger.info("Action completed", { action: "create" });

			// #then - output has both binding and context
			const output = JSON.parse(consoleInfoSpy.mock.calls[0][0] as string);
			expect(output.userId).toBe("user-1");
			expect(output.action).toBe("create");
		});

		it("#given logger #when context overrides binding #then context wins", () => {
			// #given - logger with traceId
			const logger = createConvexLogger({ traceId: "original" });

			// #when - log with different traceId
			logger.info("Message", { traceId: "override" });

			// #then - override wins
			const output = JSON.parse(consoleInfoSpy.mock.calls[0][0] as string);
			expect(output.traceId).toBe("override");
		});
	});

	describe("Log Levels", () => {
		it("#given logger #when trace called #then uses console.debug", () => {
			// #given - logger
			const logger = createConvexLogger();

			// #when - trace
			logger.trace("Trace message");

			// #then - console.debug called
			expect(consoleDebugSpy).toHaveBeenCalledOnce();
			const output = JSON.parse(consoleDebugSpy.mock.calls[0][0] as string);
			expect(output.level).toBe("trace");
		});

		it("#given logger #when debug called #then uses console.debug", () => {
			// #given - logger
			const logger = createConvexLogger();

			// #when - debug
			logger.debug("Debug message");

			// #then - console.debug called
			expect(consoleDebugSpy).toHaveBeenCalledOnce();
			const output = JSON.parse(consoleDebugSpy.mock.calls[0][0] as string);
			expect(output.level).toBe("debug");
		});

		it("#given logger #when warn called #then uses console.warn", () => {
			// #given - logger
			const logger = createConvexLogger();

			// #when - warn
			logger.warn("Warning message");

			// #then - console.warn called
			expect(consoleWarnSpy).toHaveBeenCalledOnce();
			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			expect(output.level).toBe("warn");
		});

		it("#given logger #when error called #then uses console.error", () => {
			// #given - logger
			const logger = createConvexLogger();

			// #when - error
			logger.error("Error message");

			// #then - console.error called
			expect(consoleErrorSpy).toHaveBeenCalledOnce();
			const output = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
			expect(output.level).toBe("error");
		});

		it("#given logger #when fatal called #then uses console.error", () => {
			// #given - logger
			const logger = createConvexLogger();

			// #when - fatal
			logger.fatal("Fatal message");

			// #then - console.error called
			expect(consoleErrorSpy).toHaveBeenCalledOnce();
			const output = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
			expect(output.level).toBe("fatal");
		});
	});

	describe("convexLog helper", () => {
		it("#given convexLog called #when level is info #then outputs correctly", () => {
			// #given - convexLog function available
			// #when - call with info level
			convexLog("info", "Helper function test", { requestId: "req-1" });

			// #then - outputs correct JSON
			expect(consoleInfoSpy).toHaveBeenCalledOnce();
			const output = JSON.parse(consoleInfoSpy.mock.calls[0][0] as string);
			expect(output.msg).toBe("Helper function test");
			expect(output.requestId).toBe("req-1");
			expect(output.marker).toBe(LOG_MARKER);
		});
	});

	describe("Log Entry Structure", () => {
		it("#given log output #when parsed #then has required fields", () => {
			// #given - logger
			const logger = createConvexLogger();

			// #when - log message
			logger.info("Structure test");

			// #then - has all required fields
			const output = JSON.parse(consoleInfoSpy.mock.calls[0][0] as string);
			expect(output).toHaveProperty("marker");
			expect(output).toHaveProperty("level");
			expect(output).toHaveProperty("msg");
			expect(output).toHaveProperty("time");
			expect(output).toHaveProperty("service");
		});

		it("#given log output #when time field checked #then is numeric timestamp", () => {
			// #given - logger
			const logger = createConvexLogger();
			const before = Date.now();

			// #when - log message
			logger.info("Time test");

			// #then - time is valid timestamp
			const output = JSON.parse(consoleInfoSpy.mock.calls[0][0] as string);
			const after = Date.now();
			expect(output.time).toBeGreaterThanOrEqual(before);
			expect(output.time).toBeLessThanOrEqual(after);
		});
	});

	describe("LOG_MARKER constant", () => {
		it("#given LOG_MARKER #when accessed #then has expected value", () => {
			// #given/#when - access constant
			// #then - correct value
			expect(LOG_MARKER).toBe("__VINCI_LOG__");
		});
	});
});
