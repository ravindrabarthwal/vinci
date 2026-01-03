import path from "node:path";
import { expect, test as setup } from "@playwright/test";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
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
