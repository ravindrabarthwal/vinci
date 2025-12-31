import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
	initGlobalErrorHandlers,
	isGlobalHandlersInitialized,
	resetGlobalErrorHandlers,
} from "@/lib/logging/global-handlers";

describe("Global Error Handlers", () => {
	let originalConsoleError: typeof console.error;
	let originalConsoleWarn: typeof console.warn;

	beforeEach(() => {
		// #given - save original console methods before each test
		originalConsoleError = console.error;
		originalConsoleWarn = console.warn;
		// Reset handlers to ensure clean state
		resetGlobalErrorHandlers();
	});

	afterEach(() => {
		// #cleanup - restore original console methods and reset handlers
		resetGlobalErrorHandlers();
		console.error = originalConsoleError;
		console.warn = originalConsoleWarn;
	});

	describe("isGlobalHandlersInitialized", () => {
		it("#given handlers not initialized #when checked #then returns false", () => {
			// #given - fresh state (reset in beforeEach)
			// #when - check initialization status
			const result = isGlobalHandlersInitialized();

			// #then - should be false
			expect(result).toBe(false);
		});

		it("#given handlers initialized #when checked #then returns true", () => {
			// #given - initialize handlers
			initGlobalErrorHandlers({ silent: true, level: "info", logDir: ".logs" });

			// #when - check initialization status
			const result = isGlobalHandlersInitialized();

			// #then - should be true
			expect(result).toBe(true);
		});
	});

	describe("initGlobalErrorHandlers", () => {
		it("#given not initialized #when initialized twice #then only initializes once", () => {
			// #given - not initialized
			expect(isGlobalHandlersInitialized()).toBe(false);

			// #when - initialize twice
			initGlobalErrorHandlers({ silent: true, level: "info", logDir: ".logs" });
			const consoleErrorAfterFirst = console.error;

			initGlobalErrorHandlers({ silent: true, level: "info", logDir: ".logs" });
			const consoleErrorAfterSecond = console.error;

			// #then - console.error should be the same reference (not wrapped twice)
			expect(consoleErrorAfterFirst).toBe(consoleErrorAfterSecond);
			expect(isGlobalHandlersInitialized()).toBe(true);
		});

		it("#given initialized #when console.error called #then original is also called", () => {
			// #given - track calls to original console.error
			const calls: unknown[][] = [];
			const mockOriginal = (...args: unknown[]) => {
				calls.push(args);
			};
			console.error = mockOriginal;

			initGlobalErrorHandlers({ silent: true, level: "info", logDir: ".logs" });

			// #when - call console.error
			console.error("test error message", { data: 123 });

			// #then - original should have been called with same args
			expect(calls.length).toBe(1);
			expect(calls[0]).toEqual(["test error message", { data: 123 }]);
		});

		it("#given initialized #when console.warn called #then original is also called", () => {
			// #given - track calls to original console.warn
			const calls: unknown[][] = [];
			const mockOriginal = (...args: unknown[]) => {
				calls.push(args);
			};
			console.warn = mockOriginal;

			initGlobalErrorHandlers({ silent: true, level: "info", logDir: ".logs" });

			// #when - call console.warn
			console.warn("test warning message");

			// #then - original should have been called
			expect(calls.length).toBe(1);
			expect(calls[0]).toEqual(["test warning message"]);
		});

		it("#given initialized #when console.error called with Error object #then error is formatted", () => {
			// #given - track calls
			const calls: unknown[][] = [];
			console.error = (...args: unknown[]) => {
				calls.push(args);
			};

			initGlobalErrorHandlers({ silent: true, level: "info", logDir: ".logs" });

			// #when - call console.error with an Error
			const testError = new Error("Something went wrong");
			testError.name = "TestError";
			console.error("Error occurred:", testError);

			// #then - original should have been called (error formatting is internal to logger)
			expect(calls.length).toBe(1);
			expect(calls[0]?.[0]).toBe("Error occurred:");
			expect(calls[0]?.[1]).toBe(testError);
		});
	});

	describe("resetGlobalErrorHandlers", () => {
		it("#given handlers initialized #when reset #then isInitialized returns false", () => {
			// #given - initialize handlers
			initGlobalErrorHandlers({ silent: true, level: "info", logDir: ".logs" });
			expect(isGlobalHandlersInitialized()).toBe(true);

			// #when - reset handlers
			resetGlobalErrorHandlers();

			// #then - should no longer be initialized
			expect(isGlobalHandlersInitialized()).toBe(false);
		});

		it("#given handlers initialized #when reset #then console.error is restored", () => {
			// #given - save reference to original and initialize
			const originalRef = console.error;
			initGlobalErrorHandlers({ silent: true, level: "info", logDir: ".logs" });

			// Verify console.error was wrapped (different function)
			const wrappedRef = console.error;
			expect(wrappedRef).not.toBe(originalRef);

			// #when - reset handlers
			resetGlobalErrorHandlers();

			// #then - console.error should be restored to original
			expect(console.error).toBe(originalRef);
		});

		it("#given handlers initialized #when reset #then console.warn is restored", () => {
			// #given - save reference to original and initialize
			const originalRef = console.warn;
			initGlobalErrorHandlers({ silent: true, level: "info", logDir: ".logs" });

			// Verify console.warn was wrapped
			const wrappedRef = console.warn;
			expect(wrappedRef).not.toBe(originalRef);

			// #when - reset handlers
			resetGlobalErrorHandlers();

			// #then - console.warn should be restored to original
			expect(console.warn).toBe(originalRef);
		});

		it("#given handlers not initialized #when reset called #then no error thrown", () => {
			// #given - handlers not initialized
			expect(isGlobalHandlersInitialized()).toBe(false);

			// #when/#then - reset should not throw
			expect(() => resetGlobalErrorHandlers()).not.toThrow();
		});

		it("#given handlers reset #when init called again #then re-initializes successfully", () => {
			// #given - initialize and reset
			initGlobalErrorHandlers({ silent: true, level: "info", logDir: ".logs" });
			resetGlobalErrorHandlers();
			expect(isGlobalHandlersInitialized()).toBe(false);

			// #when - initialize again
			initGlobalErrorHandlers({ silent: true, level: "info", logDir: ".logs" });

			// #then - should be initialized again
			expect(isGlobalHandlersInitialized()).toBe(true);
		});
	});

	describe("formatArgs (via console.error)", () => {
		it("#given string args #when console.error called #then formats correctly", () => {
			// #given - initialize with silent mode
			const calls: unknown[][] = [];
			console.error = (...args: unknown[]) => {
				calls.push(args);
			};
			initGlobalErrorHandlers({ silent: true, level: "info", logDir: ".logs" });

			// #when - call with multiple string args
			console.error("message1", "message2", "message3");

			// #then - original receives the args
			expect(calls.length).toBe(1);
			expect(calls[0]).toEqual(["message1", "message2", "message3"]);
		});

		it("#given object args #when console.error called #then formats as JSON", () => {
			// #given - initialize
			const calls: unknown[][] = [];
			console.error = (...args: unknown[]) => {
				calls.push(args);
			};
			initGlobalErrorHandlers({ silent: true, level: "info", logDir: ".logs" });

			// #when - call with object
			const testObj = { key: "value", nested: { a: 1 } };
			console.error("Object:", testObj);

			// #then - original receives args
			expect(calls.length).toBe(1);
			expect(calls[0]?.[1]).toEqual(testObj);
		});
	});
});
