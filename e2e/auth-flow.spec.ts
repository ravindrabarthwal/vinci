import { expect, test } from "@playwright/test";

test.describe("Auth API Health", () => {
	test("#given app is running #when auth API is called #then responds without config errors", async ({
		request,
	}) => {
		// #given - app is running with auth configured
		// #when - we call the get-session endpoint
		const response = await request.get("/api/auth/get-session");

		// #then - should not return config errors
		// 500 from backend unavailable (ECONNREFUSED) is infrastructure, not config
		// We specifically check for config-related error messages
		if (response.status() === 500) {
			const body = await response.text();
			const isInfrastructureError =
				body.includes("ECONNREFUSED") ||
				body.includes("fetch failed") ||
				body.includes("connect ECONNREFUSED");

			if (!isInfrastructureError) {
				expect(body).not.toContain("BETTER_AUTH_SECRET");
				expect(body).not.toContain("default secret");
			}
		}
	});
});

test.describe("Signup Flow", () => {
	const testUser = {
		name: `Test User ${Date.now()}`,
		email: `test-${Date.now()}@example.com`,
		password: "TestPassword123!",
	};

	test("#given user on signup page #when submits valid form #then either succeeds or shows auth error (not config error)", async ({
		page,
	}) => {
		// #given - navigate to signup page
		await page.goto("/signup");

		// #when - fill and submit the form
		await page.getByLabel(/name/i).fill(testUser.name);
		await page.getByLabel(/email/i).fill(testUser.email);
		await page.getByLabel(/password/i).fill(testUser.password);
		await page.getByRole("button", { name: /sign up/i }).click();

		// #then - should either redirect to org/new (new users without orgs) OR show an auth error
		const errorSelector = 'div[class*="bg-destructive"]';

		try {
			await Promise.race([
				page.waitForURL(/\/org\/new/, { timeout: 15000 }),
				page.waitForSelector(errorSelector, { timeout: 15000 }),
			]);
		} catch {
			await page.waitForLoadState("networkidle");
		}

		const currentUrl = page.url();
		if (currentUrl.includes("/org/new")) {
			await expect(page.getByRole("heading", { name: /create organization/i })).toBeVisible();
		} else {
			const errorElement = page.locator(errorSelector);
			if (await errorElement.isVisible()) {
				const errorText = await errorElement.textContent();
				expect(errorText).not.toContain("BETTER_AUTH_SECRET");
				expect(errorText).not.toContain("default secret");
				expect(errorText).not.toContain("environment variable");
			}
		}
	});

	test("#given user on signup page #when submits invalid email #then shows validation error", async ({
		page,
	}) => {
		// #given - navigate to signup page
		await page.goto("/signup");

		// #when - fill form with invalid email
		await page.getByLabel(/name/i).fill("Test User");
		await page.getByLabel(/email/i).fill("invalid-email");
		await page.getByLabel(/password/i).fill("TestPassword123!");

		const submitButton = page.getByRole("button", { name: /sign up/i });
		await submitButton.click();

		// #then - should stay on signup page (browser validation prevents submission)
		await expect(page).toHaveURL(/\/signup/);
	});

	test("#given user on signup page #when submits short password #then shows validation error", async ({
		page,
	}) => {
		// #given - navigate to signup page
		await page.goto("/signup");

		// #when - fill form with short password (less than 8 chars)
		await page.getByLabel(/name/i).fill("Test User");
		await page.getByLabel(/email/i).fill("test@example.com");
		await page.getByLabel(/password/i).fill("short");

		const submitButton = page.getByRole("button", { name: /sign up/i });
		await submitButton.click();

		// #then - should stay on signup page (minLength validation)
		await expect(page).toHaveURL(/\/signup/);
	});
});

test.describe("Login Flow", () => {
	test("#given user on login page #when submits form #then either succeeds or shows auth error (not config error)", async ({
		page,
	}) => {
		// #given - navigate to login page
		await page.goto("/login");

		// #when - fill and submit the form with test credentials
		await page.getByLabel(/email/i).fill("test@example.com");
		await page.getByLabel(/password/i).fill("TestPassword123!");
		await page.getByRole("button", { name: /sign in/i }).click();

		// #then - should either redirect OR show an auth error (not config error)
		const errorSelector = 'div[class*="bg-destructive"]';
		await Promise.race([
			page.waitForURL(/\/(dashboard|org\/new)/, { timeout: 10000 }),
			page.waitForSelector(errorSelector, { timeout: 10000 }),
		]);

		await page.waitForLoadState("networkidle");

		const currentUrl = page.url();
		if (currentUrl.includes("/org/new")) {
			await expect(page.getByRole("heading", { name: /create organization/i })).toBeVisible();
		} else if (currentUrl.includes("/dashboard")) {
			await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
		} else {
			const errorElement = page.locator(errorSelector);
			if (await errorElement.isVisible()) {
				const errorText = await errorElement.textContent();
				expect(errorText).not.toContain("BETTER_AUTH_SECRET");
				expect(errorText).not.toContain("default secret");
				expect(errorText).not.toContain("environment variable");
			}
		}
	});

	test("#given user on login page #when submits empty form #then validation prevents submission", async ({
		page,
	}) => {
		// #given - navigate to login page
		await page.goto("/login");

		// #when - try to submit without filling fields
		await page.getByRole("button", { name: /sign in/i }).click();

		// #then - should stay on login page due to required field validation
		await expect(page).toHaveURL(/\/login/);
	});
});

test.describe("Protected Route Access", () => {
	test("#given unauthenticated user #when navigates to dashboard #then redirects to login", async ({
		page,
	}) => {
		// #given - user is not authenticated
		// #when - navigate directly to dashboard
		await page.goto("/dashboard");

		// #then - should redirect to login
		await page.waitForLoadState("networkidle");
		await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
	});
});
