import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createNodeLogger } from "@/lib/logging/logger-node";
import { generateTraceId, TRACE_ID_COOKIE, TRACE_ID_HEADER } from "@/lib/logging/trace";

const logger = createNodeLogger({
	level: process.env.LOG_LEVEL ?? "warn",
	logDir: process.env.LOG_DIR ?? ".logs",
	silent: process.env.LOG_SILENT === "true",
});

export function proxy(request: NextRequest) {
	const startTime = Date.now();
	const existingTraceId = request.headers.get(TRACE_ID_HEADER);
	const traceId = existingTraceId ?? generateTraceId();

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set(TRACE_ID_HEADER, traceId);

	const { pathname, search } = request.nextUrl;
	const method = request.method;

	logger.info({
		msg: "Request started",
		traceId,
		method,
		path: pathname,
		query: search || undefined,
		userAgent: request.headers.get("user-agent") ?? undefined,
	});

	const response = NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});

	response.headers.set(TRACE_ID_HEADER, traceId);

	response.cookies.set(TRACE_ID_COOKIE, traceId, {
		httpOnly: false,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60,
	});

	const durationMs = Date.now() - startTime;
	logger.info({
		msg: "Request completed",
		traceId,
		method,
		path: pathname,
		durationMs,
	});

	return response;
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
