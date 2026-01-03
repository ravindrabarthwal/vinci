import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Public Pages", () => {
	test("homepage shows welcome message and navigation links", async ({ page }) => {
		await page.goto("/");

		await expect(page.getByRole("heading", { name: "Vinci" })).toBeVisible();
		await expect(page.getByText("Built with Next.js, Convex, and Better Auth")).toBeVisible();
		await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
		await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();
	});

	test("login page shows form with email and password fields", async ({ page }) => {
		await page.goto("/login");

		await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
		await expect(page.getByText("Enter your email and password")).toBeVisible();
		await expect(page.getByLabel("Email")).toBeVisible();
		await expect(page.getByLabel("Password")).toBeVisible();
		await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
		await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
	});

	test("signup page shows form with name, email, and password fields", async ({ page }) => {
		await page.goto("/signup");

		await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible();
		await expect(page.getByText("Enter your details")).toBeVisible();
		await expect(page.getByLabel("Name")).toBeVisible();
		await expect(page.getByLabel("Email")).toBeVisible();
		await expect(page.getByLabel("Password")).toBeVisible();
		await expect(page.getByRole("button", { name: "Sign Up" })).toBeVisible();
		await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
	});

	test("homepage Sign In link navigates to login page", async ({ page }) => {
		await page.goto("/");

		await page.getByRole("link", { name: "Sign In" }).click();

		await expect(page).toHaveURL("/login");
	});

	test("homepage Sign Up link navigates to signup page", async ({ page }) => {
		await page.goto("/");

		await page.getByRole("link", { name: "Sign Up" }).click();

		await expect(page).toHaveURL("/signup");
	});

	test("login page has link to signup page", async ({ page }) => {
		await page.goto("/login");

		await page.getByRole("link", { name: "Sign up" }).click();

		await expect(page).toHaveURL("/signup");
	});

	test("signup page has link to login page", async ({ page }) => {
		await page.goto("/signup");

		await page.getByRole("link", { name: "Sign in" }).click();

		await expect(page).toHaveURL("/login");
	});
});
