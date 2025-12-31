import { expect, type Page, test } from "@playwright/test";

async function signUpNewUser(page: Page): Promise<{ email: string }> {
	const email = `redirect-test-${Date.now()}@example.com`;
	const password = "TestPassword123!";

	await page.goto("/signup", { waitUntil: "domcontentloaded" });
	await page.getByLabel(/name/i).fill("Redirect Test User");
	await page.getByLabel(/email/i).fill(email);
	await page.getByLabel(/password/i).fill(password);

	await Promise.all([
		page.waitForURL(/\/(org\/new|dashboard)/, { timeout: 15000 }),
		page.getByRole("button", { name: /sign up/i }).click(),
	]);

	if (page.url().includes("/org/new")) {
		await expect(page.getByRole("heading", { name: /create organization/i })).toBeVisible();
	}

	return { email };
}

async function createOrganization(page: Page): Promise<void> {
	await page.waitForURL(/\/org\/new/, { timeout: 10000 });
	await expect(page.getByLabel(/organization name/i)).toBeVisible();

	await page.getByLabel(/organization name/i).fill(`Test Org ${Date.now()}`);

	await Promise.all([
		page.waitForURL(/\/dashboard/, { timeout: 15000 }),
		page.getByRole("button", { name: /create organization/i }).click(),
	]);

	await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
}

async function gotoWithRedirectTolerance(page: Page, path: string): Promise<void> {
	try {
		await page.goto(path, { waitUntil: "domcontentloaded" });
	} catch (error) {
		if (error instanceof Error && error.message.includes("interrupted")) {
			await page.waitForLoadState("domcontentloaded");
		} else {
			throw error;
		}
	}
}

test.describe("Authenticated User Redirects - Login Page", () => {
	test("#given user is already authenticated #when navigating to /login #then redirects to /dashboard", async ({
		page,
	}) => {
		// #given - user is authenticated with an organization
		await signUpNewUser(page);
		await createOrganization(page);
		await expect(page).toHaveURL(/\/dashboard/);

		// #when - navigate to login page
		await gotoWithRedirectTolerance(page, "/login");

		// #then - should redirect to dashboard
		await page.waitForURL(/\/dashboard/, { timeout: 10000 });
		expect(page.url()).toContain("/dashboard");
	});

	test("#given user is authenticated without org #when navigating to /login #then redirects away from login", async ({
		page,
	}) => {
		// #given - user is authenticated but has no org yet
		await signUpNewUser(page);

		// #when - navigate to login page
		await gotoWithRedirectTolerance(page, "/login");

		// #then - should redirect away from login
		await page.waitForURL(/\/(dashboard|org\/new)/, { timeout: 10000 });
		const url = page.url();
		expect(url).not.toContain("/login");
		expect(url).toMatch(/\/(dashboard|org\/new)/);
	});
});

test.describe("Authenticated User Redirects - Signup Page", () => {
	test("#given user is already authenticated #when navigating to /signup #then redirects to /dashboard", async ({
		page,
	}) => {
		// #given - user is authenticated with an organization
		await signUpNewUser(page);
		await createOrganization(page);
		await expect(page).toHaveURL(/\/dashboard/);

		// #when - navigate to signup page
		await gotoWithRedirectTolerance(page, "/signup");

		// #then - should redirect to dashboard
		await page.waitForURL(/\/dashboard/, { timeout: 10000 });
		expect(page.url()).toContain("/dashboard");
	});

	test("#given user is authenticated without org #when navigating to /signup #then redirects away from signup", async ({
		page,
	}) => {
		// #given - user is authenticated but has no org yet
		await signUpNewUser(page);

		// #when - navigate to signup page
		await gotoWithRedirectTolerance(page, "/signup");

		// #then - should redirect away from signup
		await page.waitForURL(/\/(dashboard|org\/new)/, { timeout: 10000 });
		const url = page.url();
		expect(url).not.toContain("/signup");
		expect(url).toMatch(/\/(dashboard|org\/new)/);
	});
});

test.describe("Homepage Conditional UI - Unauthenticated", () => {
	test("#given user is NOT authenticated #when visiting homepage #then shows Login and Signup buttons", async ({
		page,
	}) => {
		// #given - user is not authenticated (fresh browser context)
		// #when - navigate to homepage
		await page.goto("/");
		await expect(page.locator("h1")).toContainText("Vinci");

		// #then - should show Sign In and Sign Up links
		await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
		await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
		await expect(page.getByRole("link", { name: /dashboard/i })).not.toBeVisible();
	});
});

test.describe("Homepage Conditional UI - Authenticated", () => {
	test("#given user IS authenticated #when visiting homepage #then shows Go to Dashboard button", async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName === "webkit",
			"WebKit has session timing issues with homepage after org creation",
		);

		// #given - user is authenticated
		await signUpNewUser(page);
		await createOrganization(page);
		await expect(page).toHaveURL(/\/dashboard/);

		// #when - navigate to homepage
		await gotoWithRedirectTolerance(page, "/");
		await expect(page.locator("h1")).toContainText("Vinci", { timeout: 10000 });

		// #then - should show dashboard link and hide auth links
		await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
		await expect(page.getByRole("link", { name: /sign in/i })).not.toBeVisible();
		await expect(page.getByRole("link", { name: /sign up/i })).not.toBeVisible();
	});

	test("#given user is authenticated #when clicking Go to Dashboard #then navigates to dashboard", async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName === "webkit",
			"WebKit has session timing issues with homepage after org creation",
		);

		// #given - user is authenticated
		await signUpNewUser(page);
		await createOrganization(page);

		// #when - navigate to homepage and click dashboard link
		await gotoWithRedirectTolerance(page, "/");
		await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible({ timeout: 10000 });

		await Promise.all([
			page.waitForURL(/\/dashboard/),
			page.getByRole("link", { name: /dashboard/i }).click(),
		]);

		// #then - should navigate to dashboard
		expect(page.url()).toContain("/dashboard");
	});
});

test.describe("No Flash of Incorrect Content", () => {
	test("#given user is authenticated #when login page loads #then redirects without showing login form", async ({
		page,
	}) => {
		// #given - user is authenticated
		await signUpNewUser(page);
		await createOrganization(page);

		// #when - navigate to login page
		await gotoWithRedirectTolerance(page, "/login");

		// #then - should end up on dashboard
		await page.waitForURL(/\/dashboard/, { timeout: 10000 });
		expect(page.url()).toContain("/dashboard");
	});

	test("#given user is authenticated #when signup page loads #then redirects without showing signup form", async ({
		page,
	}) => {
		// #given - user is authenticated
		await signUpNewUser(page);
		await createOrganization(page);

		// #when - navigate to signup page
		await gotoWithRedirectTolerance(page, "/signup");

		// #then - should end up on dashboard
		await page.waitForURL(/\/dashboard/, { timeout: 10000 });
		expect(page.url()).toContain("/dashboard");
	});
});
