export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		const { initGlobalErrorHandlers } = await import("@/lib/logging/global-handlers");
		initGlobalErrorHandlers();
	}
}
