import path from "node:path";
import { expect, test as setup } from "@playwright/test";

const authFile = path.join(__dirname, ".auth/user.json");

/**
 * Wait for Convex backend to be ready by polling the health endpoint.
 * The health endpoint returns 200 when Convex functions are deployed and ready.
 */
async function waitForConvexBackend(maxWaitMs = 60000): Promise<void> {
	const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "http://127.0.0.1:3210";
	const healthUrl = `${convexSiteUrl}/health`;
	const startTime = Date.now();
	const pollIntervalMs = 1000;

	while (Date.now() - startTime < maxWaitMs) {
		try {
			const response = await fetch(healthUrl);
			if (response.ok) {
				return;
			}
		} catch {
			// Network error or Convex not ready yet, keep waiting
		}
		await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
	}
	throw new Error(`Convex backend did not become ready within ${maxWaitMs}ms`);
}

setup("authenticate", async ({ page }) => {
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
