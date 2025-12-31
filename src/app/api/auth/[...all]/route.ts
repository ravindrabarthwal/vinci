import type { NextRequest } from "next/server";
import { handler } from "@/lib/auth-server";
import { createLogger } from "@/lib/logging/logger";
import { getTraceIdFromHeaders } from "@/lib/logging/trace";

const logger = createLogger({
	level: process.env.LOG_LEVEL ?? "warn",
	logDir: process.env.LOG_DIR ?? ".logs",
	silent: process.env.LOG_SILENT === "true",
});

async function withLogging(
	request: NextRequest,
	method: string,
	handlerFn: (req: NextRequest) => Promise<Response>,
): Promise<Response> {
	const traceId = getTraceIdFromHeaders(request.headers);
	const { pathname } = request.nextUrl;
	const startTime = Date.now();

	logger.info("Auth request started", {
		traceId,
		method,
		path: pathname,
		authAction: pathname.split("/").pop(),
	});

	try {
		const response = await handlerFn(request);
		const durationMs = Date.now() - startTime;

		logger.info("Auth request completed", {
			traceId,
			method,
			path: pathname,
			statusCode: response.status,
			durationMs,
		});

		if (response.status >= 400) {
			logger.warn("Auth request failed", {
				traceId,
				method,
				path: pathname,
				statusCode: response.status,
				durationMs,
			});
		}

		return response;
	} catch (error) {
		const durationMs = Date.now() - startTime;
		logger.error("Auth request error", {
			traceId,
			method,
			path: pathname,
			durationMs,
			error: {
				name: error instanceof Error ? error.name : "Unknown",
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			},
		});
		throw error;
	}
}

export async function GET(request: NextRequest) {
	return withLogging(request, "GET", handler.GET);
}

export async function POST(request: NextRequest) {
	return withLogging(request, "POST", handler.POST);
}
