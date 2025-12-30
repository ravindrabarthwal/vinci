type EnvConfig = {
	NEXT_PUBLIC_CONVEX_URL: string;
	NEXT_PUBLIC_CONVEX_SITE_URL: string;
};

function validateEnv(): EnvConfig {
	const required = ["NEXT_PUBLIC_CONVEX_URL", "NEXT_PUBLIC_CONVEX_SITE_URL"] as const;

	const missing = required.filter((key) => !process.env[key]);

	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(", ")}. Check your .env.local file.`,
		);
	}

	return {
		NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL as string,
		NEXT_PUBLIC_CONVEX_SITE_URL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL as string,
	};
}

export const env = validateEnv();
