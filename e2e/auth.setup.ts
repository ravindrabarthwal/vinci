import { exec } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { expect, test as setup } from "@playwright/test";

const execAsync = promisify(exec);
const authFile = path.join(__dirname, ".auth/user.json");

async function setConvexEnvVar(): Promise<void> {
	if (!process.env.CI) return;

	const secret = process.env.BETTER_AUTH_SECRET;
	if (!secret) {
		console.log("[E2E Setup] No BETTER_AUTH_SECRET in environment, skipping Convex env set");
		return;
	}

	try {
		console.log("[E2E Setup] Setting BETTER_AUTH_SECRET in Convex environment...");
		await execAsync(`bunx convex env set BETTER_AUTH_SECRET "${secret}"`);
		console.log("[E2E Setup] Successfully set BETTER_AUTH_SECRET in Convex");
	} catch (error) {
		console.error("[E2E Setup] Failed to set Convex env var:", error);
	}
}

async function waitForConvexBackend(maxWaitMs = 90000): Promise<void> {
	const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "http://127.0.0.1:3211";
	const healthUrl = `${convexSiteUrl}/health`;
	const startTime = Date.now();
	const pollIntervalMs = 2000;

	console.log(`[E2E Setup] Waiting for Convex backend at ${healthUrl}...`);

	while (Date.now() - startTime < maxWaitMs) {
		try {
			const response = await fetch(healthUrl);
			if (response.ok) {
				const elapsed = Date.now() - startTime;
				console.log(`[E2E Setup] Convex backend ready after ${elapsed}ms`);
				return;
			}
			const text = await response.text().catch(() => "");
			console.log(`[E2E Setup] Health check returned ${response.status}: ${text.slice(0, 100)}`);
		} catch (error) {
			const elapsed = Date.now() - startTime;
			console.log(`[E2E Setup] Health check failed after ${elapsed}ms: ${error}`);
		}
		await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
	}
	throw new Error(
		`Convex backend did not become ready within ${maxWaitMs}ms (polling ${healthUrl})`,
	);
}

setup("authenticate", async ({ page }) => {
	await setConvexEnvVar();
	await waitForConvexBackend();

	const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
	const testEmail = `e2e-test-${uniqueId}@example.com`;
	const testPassword = "TestPassword123!";
	const testName = "E2E Test User";

	await page.goto("/signup");

	await page.getByLabel("Name").fill(testName);
	await page.getByLabel("Email").fill(testEmail);
	await page.getByLabel("Password").fill(testPassword);
	await page.getByRole("button", { name: "Sign Up" }).click();

	await expect(page).toHaveURL("/org/new", { timeout: 15000 });

	await page.getByLabel("Organization Name").fill("Test Organization");
	await page.getByRole("button", { name: "Create Organization" }).click();

	await expect(page).toHaveURL("/dashboard", { timeout: 15000 });

	await page.context().storageState({ path: authFile });
});
