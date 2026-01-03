import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
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
		test("outputs JSON with LOG_MARKER when warn is logged", () => {
			const logger = createConvexLogger();

			logger.warn("Test message");

			expect(consoleWarnSpy).toHaveBeenCalledOnce();
			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			expect(output.marker).toBe(LOG_MARKER);
			expect(output.msg).toBe("Test message");
			expect(output.level).toBe("warn");
			expect(output.service).toBe("vinci-convex");
		});

		test("includes bindings in output when logger has bindings", () => {
			const logger = createConvexLogger({ traceId: "trace-123" });

			logger.warn("Request processed");

			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			expect(output.traceId).toBe("trace-123");
		});

		test("merges context with bindings when context passed to log method", () => {
			const logger = createConvexLogger({ userId: "user-1" });

			logger.error("Action completed", { action: "create" });

			const output = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
			expect(output.userId).toBe("user-1");
			expect(output.action).toBe("create");
		});

		test("context overrides binding when same key provided", () => {
			const logger = createConvexLogger({ traceId: "original" });

			logger.error("Message", { traceId: "override" });

			const output = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
			expect(output.traceId).toBe("override");
		});
	});

	describe("Log Levels", () => {
		test("trace level is silenced (no output)", () => {
			const logger = createConvexLogger();

			logger.trace("Trace message");

			expect(consoleDebugSpy).not.toHaveBeenCalled();
		});

		test("debug level is silenced (no output)", () => {
			const logger = createConvexLogger();

			logger.debug("Debug message");

			expect(consoleDebugSpy).not.toHaveBeenCalled();
		});

		test("info level is silenced (no output)", () => {
			const logger = createConvexLogger();

			logger.info("Info message");

			expect(consoleInfoSpy).not.toHaveBeenCalled();
		});

		test("warn level uses console.warn", () => {
			const logger = createConvexLogger();

			logger.warn("Warning message");

			expect(consoleWarnSpy).toHaveBeenCalledOnce();
			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			expect(output.level).toBe("warn");
		});

		test("error level uses console.error", () => {
			const logger = createConvexLogger();

			logger.error("Error message");

			expect(consoleErrorSpy).toHaveBeenCalledOnce();
			const output = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
			expect(output.level).toBe("error");
		});

		test("fatal level uses console.error", () => {
			const logger = createConvexLogger();

			logger.fatal("Fatal message");

			expect(consoleErrorSpy).toHaveBeenCalledOnce();
			const output = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
			expect(output.level).toBe("fatal");
		});
	});

	describe("convexLog helper", () => {
		test("outputs correctly when level is warn", () => {
			convexLog("warn", "Helper function test", { requestId: "req-1" });

			expect(consoleWarnSpy).toHaveBeenCalledOnce();
			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			expect(output.msg).toBe("Helper function test");
			expect(output.requestId).toBe("req-1");
			expect(output.marker).toBe(LOG_MARKER);
		});

		test("is silenced when level is info", () => {
			convexLog("info", "Silenced message", { requestId: "req-1" });

			expect(consoleInfoSpy).not.toHaveBeenCalled();
		});
	});

	describe("Log Entry Structure", () => {
		test("has all required fields when parsed", () => {
			const logger = createConvexLogger();

			logger.warn("Structure test");

			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			expect(output).toHaveProperty("marker");
			expect(output).toHaveProperty("level");
			expect(output).toHaveProperty("msg");
			expect(output).toHaveProperty("time");
			expect(output).toHaveProperty("service");
		});

		test("time field is a numeric timestamp", () => {
			const logger = createConvexLogger();
			const before = Date.now();

			logger.warn("Time test");

			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			const after = Date.now();
			expect(output.time).toBeGreaterThanOrEqual(before);
			expect(output.time).toBeLessThanOrEqual(after);
		});
	});

	describe("LOG_MARKER constant", () => {
		test("has expected value", () => {
			expect(LOG_MARKER).toBe("__VINCI_LOG__");
		});
	});

	describe("child() method", () => {
		test("child inherits parent bindings", () => {
			const parent = createConvexLogger({ traceId: "trace-parent" });

			const child = parent.child({ requestId: "req-123" });
			child.warn("Child message");

			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			expect(output.traceId).toBe("trace-parent");
			expect(output.requestId).toBe("req-123");
		});

		test("parent bindings are not modified when child logs", () => {
			const parent = createConvexLogger({ traceId: "trace-parent" });

			const child = parent.child({ requestId: "req-123" });
			parent.warn("Parent message");
			child.warn("Child message");

			const parentOutput = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			const childOutput = JSON.parse(consoleWarnSpy.mock.calls[1][0] as string);

			expect(parentOutput.traceId).toBe("trace-parent");
			expect(parentOutput.requestId).toBeUndefined();
			expect(childOutput.traceId).toBe("trace-parent");
			expect(childOutput.requestId).toBe("req-123");
		});

		test("child value wins when overriding parent binding", () => {
			const parent = createConvexLogger({ traceId: "parent-trace" });

			const child = parent.child({ traceId: "child-trace" });
			child.warn("Override test");

			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			expect(output.traceId).toBe("child-trace");
		});

		test("all bindings are merged correctly with nested children", () => {
			const parent = createConvexLogger({ level: "parent" });
			const child = parent.child({ level: "child", childProp: "c" });
			const grandchild = child.child({ level: "grandchild", grandProp: "g" });

			grandchild.warn("Nested test");

			const output = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
			expect(output.level).toBe("grandchild");
			expect(output.childProp).toBe("c");
			expect(output.grandProp).toBe("g");
		});
	});

	describe("flush() method", () => {
		test("does not throw when called", () => {
			const logger = createConvexLogger();

			expect(() => logger.flush()).not.toThrow();
		});

		test("does not throw when called on child logger", () => {
			const parent = createConvexLogger({ traceId: "trace-1" });
			const child = parent.child({ requestId: "req-1" });

			expect(() => child.flush()).not.toThrow();
		});
	});
});
