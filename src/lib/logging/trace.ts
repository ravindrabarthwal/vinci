import { headers } from "next/headers";

export const TRACE_ID_HEADER = "x-trace-id";
export const TRACE_ID_COOKIE = "vinci_trace_id";

export function generateTraceId(): string {
	return crypto.randomUUID();
}

export async function getTraceId(): Promise<string | undefined> {
	try {
		const headerStore = await headers();
		return headerStore.get(TRACE_ID_HEADER) ?? undefined;
	} catch {
		return undefined;
	}
}

export function getTraceIdFromHeaders(reqHeaders: Headers): string | undefined {
	return reqHeaders.get(TRACE_ID_HEADER) ?? undefined;
}

export function getTraceIdFromCookie(): string | undefined {
	if (typeof document === "undefined") {
		return undefined;
	}
	const cookies = document.cookie.split(";");
	for (const cookie of cookies) {
		const [name, value] = cookie.trim().split("=");
		if (name === TRACE_ID_COOKIE) {
			return value;
		}
	}
	return undefined;
}
