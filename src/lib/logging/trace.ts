import { headers } from "next/headers";

export {
	generateTraceId,
	getTraceIdFromCookie,
	getTraceIdFromHeaders,
	TRACE_ID_COOKIE,
	TRACE_ID_HEADER,
} from "./trace-client";

export async function getTraceId(): Promise<string | undefined> {
	try {
		const headerStore = await headers();
		return headerStore.get("x-trace-id") ?? undefined;
	} catch {
		return undefined;
	}
}
