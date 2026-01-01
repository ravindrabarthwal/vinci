import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { createEdgeLogger, edgeLogger } from "@/lib/logging/logger-edge";

describe("Edge Logger", () => {
	let consoleDebugSpy: ReturnType<typeof spyOn>;
	let consoleInfoSpy: ReturnType<typeof spyOn>;
	let consoleWarnSpy: ReturnType<typeof spyOn>;
	let consoleErrorSpy: ReturnType<typeof spyOn>;

	beforeEach(() => {
		consoleDebugSpy = spyOn(console, "debug").mockImplementation(() => {});
		consoleInfoSpy = spyOn(console, "info").mockImplementation(() => {});
		consoleWarnSpy = spyOn(console, "warn").mockImplementation(() => {});
		consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleDebugSpy.mockRestore();
		consoleInfoSpy.mockRestore();
		consoleWarnSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	describe("createEdgeLogger", () => {
		it("#given edge logger #when info called #then outputs to console.info", () => {
			// #given
			const logger = createEdgeLogger();

			// #when
			logger.info("Test message");

			// #then
			expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
			const output = JSON.parse(consoleInfoSpy.mock.calls[0]?.[0] as string);
			expect(output.msg).toBe("Test message");
			expect(output.runtime).toBe("edge");
		});

		it("#given edge logger #when trace called #then outputs to console.debug", () => {
			// #given
			const logger = createEdgeLogger();

			// #when
			logger.trace("Trace message");

			// #then
			expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
		});

		it("#given edge logger #when debug called #then outputs to console.debug", () => {
			// #given
			const logger = createEdgeLogger();

			// #when
			logger.debug("Debug message");

			// #then
			expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
		});

		it("#given edge logger #when warn called #then outputs to console.warn", () => {
			// #given
			const logger = createEdgeLogger();

			// #when
			logger.warn("Warning message");

			// #then
			expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
			const output = JSON.parse(consoleWarnSpy.mock.calls[0]?.[0] as string);
			expect(output.level).toBe("warn");
		});

		it("#given edge logger #when error called #then outputs to console.error", () => {
			// #given
			const logger = createEdgeLogger();

			// #when
			logger.error("Error message");

			// #then
			expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
			const output = JSON.parse(consoleErrorSpy.mock.calls[0]?.[0] as string);
			expect(output.level).toBe("error");
		});

		it("#given edge logger #when fatal called #then outputs to console.error", () => {
			// #given
			const logger = createEdgeLogger();

			// #when
			logger.fatal("Fatal message");

			// #then
			expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
			const output = JSON.parse(consoleErrorSpy.mock.calls[0]?.[0] as string);
			expect(output.level).toBe("fatal");
		});

		it("#given edge logger with bindings #when log called #then includes bindings", () => {
			// #given
			const logger = createEdgeLogger({ traceId: "trace-123" });

			// #when
			logger.info("Message with bindings");

			// #then
			const output = JSON.parse(consoleInfoSpy.mock.calls[0]?.[0] as string);
			expect(output.traceId).toBe("trace-123");
		});

		it("#given edge logger #when context passed #then merges with bindings", () => {
			// #given
			const logger = createEdgeLogger({ traceId: "trace-123" });

			// #when
			logger.info("Merged message", { userId: "user-1" });

			// #then
			const output = JSON.parse(consoleInfoSpy.mock.calls[0]?.[0] as string);
			expect(output.traceId).toBe("trace-123");
			expect(output.userId).toBe("user-1");
		});
	});

	describe("child() method", () => {
		it("#given edge logger #when child created #then inherits parent bindings", () => {
			// #given
			const logger = createEdgeLogger({ traceId: "trace-123" });

			// #when
			const child = logger.child({ userId: "user-1" });
			child.info("Child message");

			// #then
			const output = JSON.parse(consoleInfoSpy.mock.calls[0]?.[0] as string);
			expect(output.traceId).toBe("trace-123");
			expect(output.userId).toBe("user-1");
		});

		it("#given child logger #when context overrides parent #then child context wins", () => {
			// #given
			const logger = createEdgeLogger({ traceId: "parent-trace" });

			// #when
			const child = logger.child({ traceId: "child-trace" });
			child.info("Override test");

			// #then
			const output = JSON.parse(consoleInfoSpy.mock.calls[0]?.[0] as string);
			expect(output.traceId).toBe("child-trace");
		});

		it("#given child logger #when grandchild created #then all bindings inherited", () => {
			// #given
			const logger = createEdgeLogger({ traceId: "trace-123" });
			const child = logger.child({ userId: "user-1" });

			// #when
			const grandchild = child.child({ requestId: "req-1" });
			grandchild.info("Grandchild message");

			// #then
			const output = JSON.parse(consoleInfoSpy.mock.calls[0]?.[0] as string);
			expect(output.traceId).toBe("trace-123");
			expect(output.userId).toBe("user-1");
			expect(output.requestId).toBe("req-1");
		});
	});

	describe("flush() method", () => {
		it("#given edge logger #when flush called #then does not throw", () => {
			// #given
			const logger = createEdgeLogger();

			// #when/#then
			expect(() => logger.flush()).not.toThrow();
		});
	});

	describe("Log entry structure", () => {
		it("#given edge logger output #when parsed #then has runtime field set to edge", () => {
			// #given
			const logger = createEdgeLogger();

			// #when
			logger.warn("Structure test");

			// #then
			const output = JSON.parse(consoleWarnSpy.mock.calls[0]?.[0] as string);
			expect(output.runtime).toBe("edge");
			expect(output.service).toBe("vinci-edge");
		});

		it("#given edge logger output #when parsed #then has required fields", () => {
			// #given
			const logger = createEdgeLogger();

			// #when
			logger.info("Required fields test");

			// #then
			const output = JSON.parse(consoleInfoSpy.mock.calls[0]?.[0] as string);
			expect(output).toHaveProperty("level", "info");
			expect(output).toHaveProperty("msg", "Required fields test");
			expect(output).toHaveProperty("time");
			expect(output).toHaveProperty("service", "vinci-edge");
			expect(output).toHaveProperty("runtime", "edge");
		});

		it("#given edge logger time field #when parsed #then is valid ISO timestamp", () => {
			// #given
			const logger = createEdgeLogger();

			// #when
			logger.info("Time test");

			// #then
			const output = JSON.parse(consoleInfoSpy.mock.calls[0]?.[0] as string);
			const parsedTime = new Date(output.time);
			expect(parsedTime.toISOString()).toBe(output.time);
		});
	});

	describe("edgeLogger singleton", () => {
		it("#given edgeLogger #when used #then works correctly", () => {
			// #given - edgeLogger is exported singleton
			// #when
			edgeLogger.info("Singleton test");

			// #then
			expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
		});
	});
});
