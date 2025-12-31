import { describe, expect, it } from "bun:test";
import {
	generateTraceId,
	getTraceIdFromCookie,
	getTraceIdFromHeaders,
	TRACE_ID_COOKIE,
	TRACE_ID_HEADER,
} from "@/lib/logging/trace";

describe("Logging - Trace Utilities", () => {
	describe("generateTraceId", () => {
		it("#given generateTraceId is called #when executed #then returns valid UUID v4 format", () => {
			// #given - function is available
			// #when - generate a trace ID
			const traceId = generateTraceId();

			// #then - should be valid UUID format
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			expect(traceId).toMatch(uuidRegex);
		});

		it("#given generateTraceId called multiple times #when compared #then each is unique", () => {
			// #given - function is available
			// #when - generate multiple trace IDs
			const traceId1 = generateTraceId();
			const traceId2 = generateTraceId();
			const traceId3 = generateTraceId();

			// #then - all should be unique
			expect(traceId1).not.toBe(traceId2);
			expect(traceId2).not.toBe(traceId3);
			expect(traceId1).not.toBe(traceId3);
		});
	});

	describe("getTraceIdFromHeaders", () => {
		it("#given headers with trace ID #when extracted #then returns correct value", () => {
			// #given - headers containing trace ID
			const headers = new Headers();
			const expectedTraceId = "abc-123-def-456";
			headers.set(TRACE_ID_HEADER, expectedTraceId);

			// #when - extract trace ID
			const result = getTraceIdFromHeaders(headers);

			// #then - should return the trace ID
			expect(result).toBe(expectedTraceId);
		});

		it("#given headers without trace ID #when extracted #then returns undefined", () => {
			// #given - headers without trace ID
			const headers = new Headers();

			// #when - extract trace ID
			const result = getTraceIdFromHeaders(headers);

			// #then - should return undefined
			expect(result).toBeUndefined();
		});

		it("#given empty header value #when extracted #then returns undefined", () => {
			// #given - headers with empty trace ID
			const headers = new Headers();
			headers.set(TRACE_ID_HEADER, "");

			// #when - extract trace ID
			const result = getTraceIdFromHeaders(headers);

			// #then - should return undefined (empty string becomes null/undefined)
			expect(result).toBeFalsy();
		});
	});

	describe("getTraceIdFromCookie - Server Environment", () => {
		it("#given server environment (no document) #when called #then returns undefined", () => {
			// #given - server environment (document is undefined by default in bun:test)
			// #when - try to extract trace ID
			const result = getTraceIdFromCookie();

			// #then - should return undefined since document doesn't exist
			expect(result).toBeUndefined();
		});
	});

	describe("Constants", () => {
		it("#given TRACE_ID_HEADER constant #when accessed #then has expected value", () => {
			// #given/#when - access constant
			// #then - should be the expected header name
			expect(TRACE_ID_HEADER).toBe("x-trace-id");
		});

		it("#given TRACE_ID_COOKIE constant #when accessed #then has expected value", () => {
			// #given/#when - access constant
			// #then - should be the expected cookie name
			expect(TRACE_ID_COOKIE).toBe("vinci_trace_id");
		});
	});
});
