import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import {
	clientLogger,
	createClientLogger,
	initClientErrorHandlers,
	isClientErrorHandlersInitialized,
	resetClientErrorHandlers,
} from "@/lib/logging/logger-client";

describe("Client Logger", () => {
	let originalFetch: typeof fetch;
	let fetchCalls: Array<{ url: string; options: RequestInit }>;

	beforeEach(() => {
		// #given - mock fetch to track calls
		fetchCalls = [];
		originalFetch = globalThis.fetch;
		globalThis.fetch = mock((url: string | URL | Request, options?: RequestInit) => {
			fetchCalls.push({ url: String(url), options: options ?? {} });
			return Promise.resolve(new Response(JSON.stringify({ success: true })));
		}) as unknown as typeof fetch;

		resetClientErrorHandlers();
	});

	afterEach(() => {
		// #cleanup
		globalThis.fetch = originalFetch;
		resetClientErrorHandlers();
	});

	describe("createClientLogger", () => {
		it("#given logger created #when info called #then does NOT send to server", () => {
			// #given
			const logger = createClientLogger();

			// #when
			logger.info("Test info");

			// #then - info level should not trigger sendToServer
			expect(fetchCalls.length).toBe(0);
		});

		it("#given logger created #when error called #then sends to server once", () => {
			// #given
			const logger = createClientLogger();

			// #when
			logger.error("Test error");

			// #then - should send exactly ONE request
			expect(fetchCalls.length).toBe(1);
			expect(fetchCalls[0]?.url).toBe("/api/log");
		});

		it("#given logger created #when warn called #then sends to server once", () => {
			// #given
			const logger = createClientLogger();

			// #when
			logger.warn("Test warning");

			// #then - should send exactly ONE request
			expect(fetchCalls.length).toBe(1);
		});

		it("#given logger with bindings #when child created #then child inherits bindings", () => {
			// #given
			const logger = createClientLogger({ userId: "user-1" });

			// #when
			const childLogger = logger.child({ requestId: "req-1" });
			childLogger.error("Child error");

			// #then - payload should contain both bindings
			const payload = JSON.parse(fetchCalls[0]?.options.body as string);
			expect(payload.userId).toBe("user-1");
			expect(payload.requestId).toBe("req-1");
		});

		it("#given logger #when flush called #then does not throw", () => {
			// #given
			const logger = createClientLogger();

			// #when/#then - flush is no-op but should not throw
			expect(() => logger.flush()).not.toThrow();
		});

		it("#given logger #when fatal called #then sends to server", () => {
			// #given
			const logger = createClientLogger();

			// #when
			logger.fatal("Fatal error");

			// #then - should send request
			expect(fetchCalls.length).toBe(1);
		});

		it("#given logger #when trace called #then does NOT send to server", () => {
			// #given
			const logger = createClientLogger();

			// #when
			logger.trace("Trace message");

			// #then
			expect(fetchCalls.length).toBe(0);
		});

		it("#given logger #when debug called #then does NOT send to server", () => {
			// #given
			const logger = createClientLogger();

			// #when
			logger.debug("Debug message");

			// #then
			expect(fetchCalls.length).toBe(0);
		});
	});

	// NOTE: These tests require browser 'window' object (HappyDOM).
	// Skipped because browser error handler behavior is better tested via E2E.
	describe.skip("Duplicate logging prevention (CRITICAL)", () => {
		let consoleErrorSpy: ReturnType<typeof spyOn>;
		let consoleWarnSpy: ReturnType<typeof spyOn>;

		beforeEach(() => {
			// #given - setup console spies
			consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
			consoleWarnSpy = spyOn(console, "warn").mockImplementation(() => {});
		});

		afterEach(() => {
			// #cleanup
			consoleErrorSpy.mockRestore();
			consoleWarnSpy.mockRestore();
		});

		it("#given handlers initialized #when clientLogger.error called #then only ONE network request", () => {
			// #given - initialize error handlers (which monkey-patch console)
			// HappyDOM provides window, so handlers can initialize
			initClientErrorHandlers();
			expect(isClientErrorHandlersInitialized()).toBe(true);

			// #when - call clientLogger.error
			clientLogger.error("This should send ONLY ONE request");

			// #then - CRITICAL: should be exactly 1 request, NOT 2
			expect(fetchCalls.length).toBe(1);
		});

		it("#given handlers initialized #when clientLogger.warn called #then only ONE network request", () => {
			// #given
			initClientErrorHandlers();

			// #when
			clientLogger.warn("This should send ONLY ONE request");

			// #then
			expect(fetchCalls.length).toBe(1);
		});

		it("#given handlers NOT initialized #when console.error called directly #then NO server send", () => {
			// #given - handlers NOT initialized, console.error is not patched
			expect(isClientErrorHandlersInitialized()).toBe(false);

			// #when - call console.error directly
			console.error("Direct console error without handlers");

			// #then - no fetch should happen since handlers aren't initialized
			expect(fetchCalls.length).toBe(0);
		});

		it("#given handlers initialized #when console.error called directly #then sends to server", () => {
			// #given - initialize handlers
			initClientErrorHandlers();

			// #when - call console.error directly (not through logger)
			console.error("Direct console error");

			// #then - should send to server (user's console.error should be forwarded)
			expect(fetchCalls.length).toBe(1);
		});

		it("#given handlers initialized #when console.warn called directly #then sends to server", () => {
			// #given
			initClientErrorHandlers();

			// #when
			console.warn("Direct console warn");

			// #then
			expect(fetchCalls.length).toBe(1);
		});

		it("#given logger.error and direct console.error #when both called #then each sends ONE request", () => {
			// #given
			initClientErrorHandlers();

			// #when - call both
			clientLogger.error("Logger error");
			console.error("Direct console error");

			// #then - should be exactly 2 requests (1 from logger, 1 from direct console)
			expect(fetchCalls.length).toBe(2);
		});
	});

	describe("Log entry structure", () => {
		it("#given logger #when error logged #then entry has required fields", () => {
			// #given
			const logger = createClientLogger();

			// #when
			logger.error("Structure test");

			// #then
			const payload = JSON.parse(fetchCalls[0]?.options.body as string);
			expect(payload).toHaveProperty("level", "error");
			expect(payload).toHaveProperty("msg", "Structure test");
			expect(payload).toHaveProperty("time");
			expect(payload).toHaveProperty("service", "vinci-client");
		});

		it("#given logger with error context #when logged #then formats error object", () => {
			// #given
			const logger = createClientLogger();
			const testError = new Error("Test error message");
			testError.name = "TestError";

			// #when
			logger.error("Error occurred", { error: testError });

			// #then
			const payload = JSON.parse(fetchCalls[0]?.options.body as string);
			expect(payload.error).toBeDefined();
			expect(payload.error.name).toBe("TestError");
			expect(payload.error.message).toBe("Test error message");
		});
	});

	// Requires browser window object - skip in Node/Bun environment
	describe.skip("resetClientErrorHandlers", () => {
		it("#given handlers initialized #when reset #then isInitialized returns false", () => {
			// #given - HappyDOM provides window, so handlers can initialize
			initClientErrorHandlers();
			expect(isClientErrorHandlersInitialized()).toBe(true);

			// #when
			resetClientErrorHandlers();

			// #then
			expect(isClientErrorHandlersInitialized()).toBe(false);
		});
	});
});
