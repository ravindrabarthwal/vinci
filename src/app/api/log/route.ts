import { type NextRequest, NextResponse } from "next/server";
import { getNodeLogger } from "@/lib/logging/logger-node";

const isDevelopment = process.env.NODE_ENV === "development";

const logger = getNodeLogger({
	level: "warn",
	logDir: process.env.LOG_DIR ?? ".logs",
	silent: process.env.LOG_SILENT === "true",
});

type ClientLogPayload = {
	level: "warn" | "error" | "fatal";
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

const ALLOWED_LEVELS = new Set(["warn", "error", "fatal"]);

export async function POST(request: NextRequest) {
	if (!isDevelopment) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	try {
		const payload = (await request.json()) as ClientLogPayload;

		if (!payload.level || !ALLOWED_LEVELS.has(payload.level)) {
			return NextResponse.json(
				{ error: "Invalid log level. Only warn, error, fatal allowed." },
				{ status: 400 },
			);
		}

		if (!payload.msg || typeof payload.msg !== "string") {
			return NextResponse.json({ error: "Missing or invalid msg field" }, { status: 400 });
		}

		const { level, msg, ...context } = payload;

		const logContext = {
			...context,
			source: "client",
			clientTime: payload.time,
			url: payload.url ?? request.headers.get("referer"),
			userAgent: payload.userAgent ?? request.headers.get("user-agent"),
		};

		switch (level) {
			case "warn":
				logger.warn(logContext, msg);
				break;
			case "error":
			case "fatal":
				logger.error(logContext, msg);
				break;
		}

		// Flush to ensure log is written to file immediately
		logger.flush();

		return NextResponse.json({ success: true }, { status: 200 });
	} catch {
		logger.error({ source: "client", parseError: true }, "Failed to parse client log payload");
		logger.flush();
		return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
	}
}
