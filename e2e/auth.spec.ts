import { expect, test } from "@playwright/test";

test.describe("Home page", () => {
	test("#given user navigates to home #when page loads #then displays correctly", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(page).toHaveTitle(/Vinci/);
	});
});

test.describe("Login page", () => {
	test("#given user navigates to login #when page loads #then shows login form", async ({
		page,
	}) => {
		await page.goto("/login");
		await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
		await expect(page.getByLabel(/email/i)).toBeVisible();
		await expect(page.getByLabel(/password/i)).toBeVisible();
		await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
	});

	test("#given user on login page #when clicks signup link #then navigates to signup", async ({
		page,
	}) => {
		await page.goto("/login");
		await page.getByRole("link", { name: /sign up/i }).click();
		await expect(page).toHaveURL("/signup");
	});
});

test.describe("Signup page", () => {
	test("#given user navigates to signup #when page loads #then shows signup form", async ({
		page,
	}) => {
		await page.goto("/signup");
		await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
		await expect(page.getByLabel(/name/i)).toBeVisible();
		await expect(page.getByLabel(/email/i)).toBeVisible();
		await expect(page.getByLabel(/password/i)).toBeVisible();
		await expect(page.getByRole("button", { name: /sign up/i })).toBeVisible();
	});

	test("#given user on signup page #when clicks login link #then navigates to login", async ({
		page,
	}) => {
		await page.goto("/signup");
		await page.getByRole("link", { name: /sign in/i }).click();
		await expect(page).toHaveURL("/login");
	});
});
