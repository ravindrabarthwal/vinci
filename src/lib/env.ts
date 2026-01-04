export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

type EnvConfig = {
	NEXT_PUBLIC_CONVEX_URL: string;
	NEXT_PUBLIC_CONVEX_SITE_URL: string;
	LOG_LEVEL: LogLevel;
	LOG_DIR: string;
	LOG_SILENT: boolean;
	NODE_ENV: "development" | "production" | "test";
};

const validLogLevels: readonly LogLevel[] = [
	"trace",
	"debug",
	"info",
	"warn",
	"error",
	"fatal",
] as const;

function validateEnv(): EnvConfig {
	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
	const convexSiteUrl =
		process.env.NEXT_PUBLIC_CONVEX_SITE_URL ??
		(convexUrl ? convexUrl.replace(":3210", ":3211") : undefined);

	const missing: string[] = [];
	if (!convexUrl) missing.push("NEXT_PUBLIC_CONVEX_URL");
	if (!convexSiteUrl) missing.push("NEXT_PUBLIC_CONVEX_SITE_URL");

	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(", ")}. Check your .env.local file.`,
		);
	}

	// Validate LOG_LEVEL if provided
	const logLevelInput = process.env.LOG_LEVEL ?? "info";
	if (!validLogLevels.includes(logLevelInput as LogLevel)) {
		throw new Error(
			`Invalid LOG_LEVEL: ${logLevelInput}. Valid values: ${validLogLevels.join(", ")}`,
		);
	}

	const nodeEnv = (process.env.NODE_ENV ?? "development") as EnvConfig["NODE_ENV"];

	return {
		NEXT_PUBLIC_CONVEX_URL: convexUrl as string,
		NEXT_PUBLIC_CONVEX_SITE_URL: convexSiteUrl as string,
		LOG_LEVEL: logLevelInput as LogLevel,
		LOG_DIR: process.env.LOG_DIR ?? ".logs",
		LOG_SILENT: process.env.LOG_SILENT === "true",
		NODE_ENV: nodeEnv,
	};
}

export const env = validateEnv();
