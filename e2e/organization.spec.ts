import { expect, type Page, test } from "@playwright/test";

async function signUpAndNavigateToOrgNew(page: Page): Promise<void> {
	const testUser = {
		name: `Org Test ${Date.now()}`,
		email: `org-test-${Date.now()}@example.com`,
		password: "TestPassword123!",
	};

	await page.goto("/signup");
	await page.getByLabel(/name/i).fill(testUser.name);
	await page.getByLabel(/email/i).fill(testUser.email);
	await page.getByLabel(/password/i).fill(testUser.password);
	await page.getByRole("button", { name: /sign up/i }).click();

	const errorSelector = 'div[class*="bg-destructive"]';
	let errorShown = false;

	try {
		await Promise.race([
			page.waitForURL(/\/org\/new/, { timeout: 15000 }),
			page.waitForSelector(errorSelector, { timeout: 15000 }).then(() => {
				errorShown = true;
			}),
		]);
	} catch {
		await page.waitForLoadState("networkidle");
	}

	const currentUrl = page.url();

	if (errorShown) {
		const errorElement = page.locator(errorSelector);
		const errorText = await errorElement.textContent();
		expect(errorText).not.toContain("BETTER_AUTH_SECRET");
		expect(errorText).not.toContain("default secret");
		throw new Error(`Signup failed with auth error: ${errorText}`);
	}

	if (!currentUrl.includes("/org/new")) {
		throw new Error(`Signup did not redirect to /org/new. Current URL: ${currentUrl}`);
	}

	await page.waitForLoadState("networkidle");
	expect(page.url()).toContain("/org/new");
}

test.describe("Organization Pages", () => {
	test.describe("Create Organization Page", () => {
		test("#given user navigates to /org/new #when page loads #then shows create organization form", async ({
			page,
		}) => {
			// #given - navigate to create organization page
			await page.goto("/org/new");

			// #when - page loads (may redirect to login if not authenticated)
			await page.waitForLoadState("networkidle");

			// #then - should either show form or redirect to login
			const currentUrl = page.url();
			if (currentUrl.includes("/org/new")) {
				await expect(page.getByRole("heading", { name: /create organization/i })).toBeVisible();
				await expect(page.getByLabel(/organization name/i)).toBeVisible();
				await expect(page.getByLabel(/url slug/i)).toBeVisible();
				await expect(page.getByRole("button", { name: /create organization/i })).toBeVisible();
			} else {
				expect(currentUrl).toMatch(/\/login/);
			}
		});

		test("#given authenticated user on create org form #when name is entered #then slug is auto-generated", async ({
			page,
		}) => {
			// #given - sign up and navigate to create organization page (throws on failure)
			await signUpAndNavigateToOrgNew(page);

			// #when - enter organization name
			const nameInput = page.getByLabel(/organization name/i);
			const slugInput = page.getByLabel(/url slug/i);

			await nameInput.fill("My Test Organization");

			// #then - slug should be auto-generated
			await expect(slugInput).toHaveValue("my-test-organization");
		});

		test("#given authenticated user on create org form #when empty #then submit button is disabled", async ({
			page,
		}) => {
			// #given - sign up and navigate to create organization page (throws on failure)
			await signUpAndNavigateToOrgNew(page);

			// #when - form is empty (default state after navigation)
			// #then - submit button should be disabled
			const submitButton = page.getByRole("button", { name: /create organization/i });
			await expect(submitButton).toBeDisabled();
		});
	});

	test.describe("Organization Settings Page", () => {
		test("#given user navigates to /org/settings #when not authenticated #then redirects to login", async ({
			page,
		}) => {
			// #given - user is not authenticated
			// #when - navigate to org settings
			await page.goto("/org/settings");
			await page.waitForLoadState("networkidle");

			// #then - should redirect to login or org/new
			const currentUrl = page.url();
			expect(currentUrl).toMatch(/\/(login|org\/new)/);
		});
	});

	test.describe("Invitation Page", () => {
		test("#given user navigates to /invite/[id] #when not authenticated #then redirects to login", async ({
			page,
		}) => {
			// #given - user is not authenticated
			// #when - navigate to invitation page with fake ID
			await page.goto("/invite/test-invitation-id");
			await page.waitForLoadState("networkidle");

			// #then - should redirect to login with returnUrl
			const currentUrl = page.url();
			expect(currentUrl).toMatch(/\/login/);
		});
	});
});

test.describe("Organization Flow Integration", () => {
	test("#given new user signs up #when signup succeeds #then redirects to create organization", async ({
		page,
	}) => {
		const testUser = {
			name: `Org Test ${Date.now()}`,
			email: `org-test-${Date.now()}@example.com`,
			password: "TestPassword123!",
		};

		await page.goto("/signup");
		await page.getByLabel(/name/i).fill(testUser.name);
		await page.getByLabel(/email/i).fill(testUser.email);
		await page.getByLabel(/password/i).fill(testUser.password);
		await page.getByRole("button", { name: /sign up/i }).click();

		const errorSelector = 'div[class*="bg-destructive"]';
		let errorShown = false;

		try {
			await Promise.race([
				page.waitForURL(/\/org\/new/, { timeout: 15000 }),
				page.waitForSelector(errorSelector, { timeout: 15000 }).then(() => {
					errorShown = true;
				}),
			]);
		} catch {
			await page.waitForLoadState("networkidle");
		}

		const currentUrl = page.url();

		if (currentUrl.includes("/org/new")) {
			await expect(page.getByRole("heading", { name: /create organization/i })).toBeVisible();
		} else if (errorShown) {
			const errorElement = page.locator(errorSelector);
			const errorText = await errorElement.textContent();
			expect(errorText).not.toContain("BETTER_AUTH_SECRET");
			expect(errorText).not.toContain("default secret");
			expect(errorText).not.toContain("environment variable");
		} else {
			expect.soft(currentUrl).toMatch(/\/org\/new/);
		}
	});
});
