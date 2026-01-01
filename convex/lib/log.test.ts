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
		it("#given createConvexLogger called #when warn logged #then outputs JSON with LOG_MARKER", () => {
			// #given - create logger
			const logger = createConvexLogger();

			// #when - log warn message
			logger.warn("Test message");

			// #then - console.warn called with JSON containing marker
			expect(consoleWarnSpy).toHaveBeenCalledOnce();
			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			expect(output.marker).toBe(LOG_MARKER);
			expect(output.msg).toBe("Test message");
			expect(output.level).toBe("warn");
			expect(output.service).toBe("vinci-convex");
		});

		it("#given logger with bindings #when warn logged #then includes bindings in output", () => {
			// #given - logger with traceId binding
			const logger = createConvexLogger({ traceId: "trace-123" });

			// #when - log message
			logger.warn("Request processed");

			// #then - output includes binding
			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			expect(output.traceId).toBe("trace-123");
		});

		it("#given logger #when context passed to log method #then merges with bindings", () => {
			// #given - logger with userId binding
			const logger = createConvexLogger({ userId: "user-1" });

			// #when - log with additional context
			logger.error("Action completed", { action: "create" });

			// #then - output has both binding and context
			const output = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
			expect(output.userId).toBe("user-1");
			expect(output.action).toBe("create");
		});

		it("#given logger #when context overrides binding #then context wins", () => {
			// #given - logger with traceId
			const logger = createConvexLogger({ traceId: "original" });

			// #when - log with different traceId
			logger.error("Message", { traceId: "override" });

			// #then - override wins
			const output = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
			expect(output.traceId).toBe("override");
		});
	});

	describe("Log Levels", () => {
		it("#given logger #when trace called #then does not output (silenced)", () => {
			// #given - logger
			const logger = createConvexLogger();

			// #when - trace
			logger.trace("Trace message");

			// #then - console.debug NOT called (silenced for trace/debug/info)
			expect(consoleDebugSpy).not.toHaveBeenCalled();
		});

		it("#given logger #when debug called #then does not output (silenced)", () => {
			// #given - logger
			const logger = createConvexLogger();

			// #when - debug
			logger.debug("Debug message");

			// #then - console.debug NOT called (silenced for trace/debug/info)
			expect(consoleDebugSpy).not.toHaveBeenCalled();
		});

		it("#given logger #when info called #then does not output (silenced)", () => {
			// #given - logger
			const logger = createConvexLogger();

			// #when - info
			logger.info("Info message");

			// #then - console.info NOT called (silenced for trace/debug/info)
			expect(consoleInfoSpy).not.toHaveBeenCalled();
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
		it("#given convexLog called #when level is warn #then outputs correctly", () => {
			// #given - convexLog function available
			// #when - call with warn level
			convexLog("warn", "Helper function test", { requestId: "req-1" });

			// #then - outputs correct JSON
			expect(consoleWarnSpy).toHaveBeenCalledOnce();
			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			expect(output.msg).toBe("Helper function test");
			expect(output.requestId).toBe("req-1");
			expect(output.marker).toBe(LOG_MARKER);
		});

		it("#given convexLog called #when level is info #then does not output (silenced)", () => {
			// #given - convexLog function available
			// #when - call with info level
			convexLog("info", "Silenced message", { requestId: "req-1" });

			// #then - console.info NOT called
			expect(consoleInfoSpy).not.toHaveBeenCalled();
		});
	});

	describe("Log Entry Structure", () => {
		it("#given log output #when parsed #then has required fields", () => {
			// #given - logger
			const logger = createConvexLogger();

			// #when - log message (using warn since info is silenced)
			logger.warn("Structure test");

			// #then - has all required fields
			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
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

			// #when - log message (using warn since info is silenced)
			logger.warn("Time test");

			// #then - time is valid timestamp
			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
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

	describe("child() method", () => {
		it("#given logger #when child called with bindings #then child inherits parent bindings", () => {
			// #given - parent logger with traceId
			const parent = createConvexLogger({ traceId: "trace-parent" });

			// #when - create child with additional binding
			const child = parent.child({ requestId: "req-123" });
			child.warn("Child message");

			// #then - output has both parent and child bindings
			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			expect(output.traceId).toBe("trace-parent");
			expect(output.requestId).toBe("req-123");
		});

		it("#given parent logger #when child logs #then parent bindings not modified", () => {
			// #given - parent logger
			const parent = createConvexLogger({ traceId: "trace-parent" });

			// #when - create child and both log
			const child = parent.child({ requestId: "req-123" });
			parent.warn("Parent message");
			child.warn("Child message");

			// #then - parent output doesn't have child binding
			const parentOutput = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			const childOutput = JSON.parse(consoleWarnSpy.mock.calls[1][0] as string);

			expect(parentOutput.traceId).toBe("trace-parent");
			expect(parentOutput.requestId).toBeUndefined();
			expect(childOutput.traceId).toBe("trace-parent");
			expect(childOutput.requestId).toBe("req-123");
		});

		it("#given child logger #when child overrides parent binding #then child value wins", () => {
			// #given - parent with traceId
			const parent = createConvexLogger({ traceId: "parent-trace" });

			// #when - child overrides traceId
			const child = parent.child({ traceId: "child-trace" });
			child.warn("Override test");

			// #then - child traceId used
			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			expect(output.traceId).toBe("child-trace");
		});

		it("#given nested children #when logging #then all bindings merged correctly", () => {
			// #given - parent -> child -> grandchild
			const parent = createConvexLogger({ level: "parent" });
			const child = parent.child({ level: "child", childProp: "c" });
			const grandchild = child.child({ level: "grandchild", grandProp: "g" });

			// #when - grandchild logs
			grandchild.warn("Nested test");

			// #then - all bindings present, innermost overrides
			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			expect(output.level).toBe("grandchild"); // Note: 'level' field is the log level, this tests custom prop shadowing
			expect(output.childProp).toBe("c");
			expect(output.grandProp).toBe("g");
		});
	});

	describe("flush() method", () => {
		it("#given logger #when flush called #then does not throw", () => {
			// #given - logger
			const logger = createConvexLogger();

			// #when/#then - flush completes without error
			expect(() => logger.flush()).not.toThrow();
		});

		it("#given child logger #when flush called #then does not throw", () => {
			// #given - child logger
			const parent = createConvexLogger({ traceId: "trace-1" });
			const child = parent.child({ requestId: "req-1" });

			// #when/#then - flush completes without error
			expect(() => child.flush()).not.toThrow();
		});
	});
});
