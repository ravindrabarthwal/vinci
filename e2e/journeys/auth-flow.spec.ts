import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Authentication Flow", () => {
	test("new user can sign up and reach organization creation page", async ({ page }) => {
		const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
		const testEmail = `e2e-signup-${uniqueId}@example.com`;

		await page.goto("/signup");

		await page.getByLabel("Name").fill("New Test User");
		await page.getByLabel("Email").fill(testEmail);
		await page.getByLabel("Password").fill("SecurePassword123!");
		await page.getByRole("button", { name: "Sign Up" }).click();

		await expect(page).toHaveURL("/org/new", { timeout: 15000 });
		await expect(page.getByRole("heading", { name: "Create Organization" })).toBeVisible();
	});

	test("signup form validates required fields", async ({ page }) => {
		await page.goto("/signup");

		await page.getByRole("button", { name: "Sign Up" }).click();

		await expect(page.getByLabel("Name")).toBeFocused();
	});

	test("login form validates required fields", async ({ page }) => {
		await page.goto("/login");

		await page.getByRole("button", { name: "Sign In" }).click();

		await expect(page.getByLabel("Email")).toBeFocused();
	});

	test("login with invalid credentials shows error", async ({ page }) => {
		await page.goto("/login");

		await page.getByLabel("Email").fill("nonexistent@example.com");
		await page.getByLabel("Password").fill("wrongpassword");
		await page.getByRole("button", { name: "Sign In" }).click();

		await expect(page.getByText(/failed|invalid|error/i)).toBeVisible({ timeout: 10000 });
	});

	test("unauthenticated user accessing dashboard is redirected to login", async ({ page }) => {
		await page.goto("/dashboard");

		await expect(page).toHaveURL("/login", { timeout: 15000 });
	});

	test("unauthenticated user accessing org settings is redirected to login", async ({ page }) => {
		await page.goto("/org/settings");

		await expect(page).toHaveURL("/login", { timeout: 15000 });
	});
});
