import path from "node:path";
import { expect, test as setup } from "@playwright/test";

const authFile = path.join(__dirname, ".auth/user.json");

/**
 * Wait for Convex backend to be ready by polling the auth session endpoint.
 * Returns 401 when ready (unauthenticated but backend is up), 404 when not ready.
 */
async function waitForConvexBackend(baseURL: string, maxWaitMs = 60000): Promise<void> {
	const startTime = Date.now();
	const pollIntervalMs = 1000;

	while (Date.now() - startTime < maxWaitMs) {
		try {
			const response = await fetch(`${baseURL}/api/auth/get-session`);
			// 401 means backend is ready but user isn't authenticated - that's what we want
			// 200 would mean session exists (unlikely in clean state)
			// 404 means Convex backend isn't ready yet
			if (response.status !== 404) {
				return;
			}
		} catch {
			// Network error, keep waiting
		}
		await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
	}
	throw new Error(`Convex backend did not become ready within ${maxWaitMs}ms`);
}

setup("authenticate", async ({ page, baseURL }) => {
	// Wait for Convex backend to be ready before attempting signup
	await waitForConvexBackend(baseURL ?? "http://localhost:3000");

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
