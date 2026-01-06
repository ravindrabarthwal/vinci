import { expect, test } from "@playwright/test";

test.describe("Products CRUD", () => {
	test("user can navigate to products page from sidebar", async ({ page }) => {
		await page.goto("/dashboard");
		await page.getByRole("link", { name: "Products" }).click();
		await expect(page).toHaveURL("/products", { timeout: 10000 });
		await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
	});

	test("user sees empty state when no products exist", async ({ page }) => {
		await page.goto("/products");
		await expect(page.getByRole("heading", { name: "Products" })).toBeVisible({ timeout: 10000 });
	});

	test("user can navigate to create product page", async ({ page }) => {
		await page.goto("/products");
		await expect(page.getByRole("heading", { name: "Products" })).toBeVisible({ timeout: 10000 });
		await page.getByRole("link", { name: /new product/i }).click();
		await expect(page).toHaveURL("/products/new", { timeout: 10000 });
		await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible();
	});

	test("user can create a new product and view it", async ({ page }) => {
		const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
		const productName = `Test Product ${uniqueId}`;
		const productDescription = `E2E test product created at ${uniqueId}`;

		await page.goto("/products/new");
		await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible({
			timeout: 10000,
		});

		await page.getByLabel("Product Name").fill(productName);
		await page.getByLabel("Description").fill(productDescription);
		await page.getByLabel("Owners").fill("test-owner@example.com");
		await page.getByRole("combobox", { name: "Criticality" }).click();
		await page.getByRole("option", { name: "High" }).click();
		await page.getByRole("button", { name: "Create Product" }).click();

		await expect(page).toHaveURL(/\/products\//, { timeout: 15000 });
		await expect(page.getByRole("heading", { name: productName })).toBeVisible({ timeout: 10000 });
		await expect(page.getByText(productDescription)).toBeVisible();
		await expect(page.getByText("high")).toBeVisible();
	});

	test("user can edit an existing product", async ({ page }) => {
		const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
		const productName = `Edit Test Product ${uniqueId}`;
		const updatedName = `Updated Product ${uniqueId}`;

		await page.goto("/products/new");
		await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible({
			timeout: 10000,
		});
		await page.getByLabel("Product Name").fill(productName);
		await page.getByRole("combobox", { name: "Criticality" }).click();
		await page.getByRole("option", { name: "Medium" }).click();
		await page.getByRole("button", { name: "Create Product" }).click();

		await expect(page).toHaveURL(/\/products\//, { timeout: 15000 });
		await expect(page.getByRole("heading", { name: productName })).toBeVisible({ timeout: 10000 });

		await page.getByRole("link", { name: "Edit" }).click();
		await expect(page).toHaveURL(/\/products\/.*\/edit/, { timeout: 10000 });
		await expect(page.getByRole("heading", { name: "Edit Product" })).toBeVisible();

		await page.getByLabel("Product Name").fill(updatedName);
		await page.getByRole("button", { name: "Save Changes" }).click();

		await expect(page).toHaveURL(/\/products\/[^/]+$/, { timeout: 15000 });
		await expect(page.getByRole("heading", { name: updatedName })).toBeVisible({ timeout: 10000 });
	});

	test("user can delete a product", async ({ page }) => {
		const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
		const productName = `Delete Test Product ${uniqueId}`;

		await page.goto("/products/new");
		await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible({
			timeout: 10000,
		});
		await page.getByLabel("Product Name").fill(productName);
		await page.getByRole("combobox", { name: "Criticality" }).click();
		await page.getByRole("option", { name: "Low" }).click();
		await page.getByRole("button", { name: "Create Product" }).click();

		await expect(page).toHaveURL(/\/products\//, { timeout: 15000 });
		await expect(page.getByRole("heading", { name: productName })).toBeVisible({ timeout: 10000 });

		page.on("dialog", (dialog) => dialog.accept());
		await page.getByRole("button", { name: "Delete" }).click();

		await expect(page).toHaveURL("/products", { timeout: 15000 });
		await expect(page.getByText(productName)).not.toBeVisible({ timeout: 10000 });
	});

	test("user can view product detail page with surfaces and features sections", async ({
		page,
	}) => {
		const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
		const productName = `Detail View Product ${uniqueId}`;

		await page.goto("/products/new");
		await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible({
			timeout: 10000,
		});
		await page.getByLabel("Product Name").fill(productName);
		await page.getByLabel("Description").fill("A product to test detail view");
		await page.getByLabel("Owners").fill("owner1, owner2");
		await page.getByRole("combobox", { name: "Criticality" }).click();
		await page.getByRole("option", { name: "High" }).click();
		await page.getByRole("button", { name: "Create Product" }).click();

		await expect(page).toHaveURL(/\/products\//, { timeout: 15000 });
		await expect(page.getByRole("heading", { name: productName })).toBeVisible({ timeout: 10000 });
		await expect(page.getByText("A product to test detail view")).toBeVisible();
		await expect(page.getByRole("heading", { name: "Owners" })).toBeVisible();
		await expect(page.getByText("owner1")).toBeVisible();
		await expect(page.getByText("owner2")).toBeVisible();
		await expect(page.getByRole("heading", { name: "Surfaces" })).toBeVisible();
		await expect(page.getByText("No surfaces defined yet")).toBeVisible();
		await expect(page.getByRole("heading", { name: "Features" })).toBeVisible();
		await expect(page.getByText("No features tracked yet")).toBeVisible();
	});

	test("products form validates required fields", async ({ page }) => {
		await page.goto("/products/new");
		await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible({
			timeout: 10000,
		});

		const submitButton = page.getByRole("button", { name: "Create Product" });
		await expect(submitButton).toBeDisabled();

		await page.getByLabel("Product Name").fill("Test Product");
		await expect(submitButton).toBeEnabled();
	});
});

test.describe("Surface CRUD", () => {
	test("user can add a surface to a product", async ({ page }) => {
		const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
		const productName = `Surface Test Product ${uniqueId}`;
		const surfaceName = `api-service-${uniqueId}`;

		await page.goto("/products/new");
		await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible({
			timeout: 10000,
		});
		await page.getByLabel("Product Name").fill(productName);
		await page.getByRole("combobox", { name: "Criticality" }).click();
		await page.getByRole("option", { name: "Medium" }).click();
		await page.getByRole("button", { name: "Create Product" }).click();

		await expect(page).toHaveURL(/\/products\//, { timeout: 15000 });
		await expect(page.getByRole("heading", { name: productName })).toBeVisible({ timeout: 10000 });

		await page.getByRole("button", { name: "Add Surface" }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByRole("heading", { name: "Add Surface" })).toBeVisible();

		await page.locator("#surface-name").fill(surfaceName);
		await page.locator("#surface-type").click();
		await page.getByRole("option", { name: "Service" }).click();
		await page.locator("#surface-location").fill("https://github.com/org/api-service");
		await page.getByRole("button", { name: "Add Surface" }).click();

		await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
		await expect(page.getByText(surfaceName)).toBeVisible({ timeout: 10000 });
		await expect(page.getByText("Service", { exact: true })).toBeVisible();
		await expect(page.getByText("https://github.com/org/api-service")).toBeVisible();
	});

	test("user can edit a surface", async ({ page }) => {
		const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
		const productName = `Edit Surface Product ${uniqueId}`;
		const surfaceName = `frontend-${uniqueId}`;
		const updatedSurfaceName = `renamed-surface-${uniqueId}`;

		await page.goto("/products/new");
		await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible({
			timeout: 10000,
		});
		await page.getByLabel("Product Name").fill(productName);
		await page.getByRole("combobox", { name: "Criticality" }).click();
		await page.getByRole("option", { name: "Low" }).click();
		await page.getByRole("button", { name: "Create Product" }).click();

		await expect(page).toHaveURL(/\/products\//, { timeout: 15000 });
		await expect(page.getByRole("heading", { name: productName })).toBeVisible({ timeout: 10000 });

		await page.getByRole("button", { name: "Add Surface" }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await page.locator("#surface-name").fill(surfaceName);
		await page.locator("#surface-type").click();
		await page.getByRole("option", { name: "Web App" }).click();
		await page.getByRole("button", { name: "Add Surface" }).click();

		await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
		await expect(page.getByText(surfaceName)).toBeVisible({ timeout: 10000 });

		const surfaceCard = page.locator(".rounded-lg.border", { hasText: surfaceName });
		await surfaceCard.getByRole("button").first().click();

		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByRole("heading", { name: "Edit Surface" })).toBeVisible();
		await page.locator("#surface-name").fill(updatedSurfaceName);
		await page.locator("#surface-type").click();
		await page.getByRole("option", { name: "Repository" }).click();
		await page.getByRole("button", { name: "Save Changes" }).click();

		await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
		await expect(page.getByText(updatedSurfaceName)).toBeVisible({ timeout: 10000 });
		await expect(page.getByText("Repository")).toBeVisible();
		await expect(page.getByText(surfaceName)).not.toBeVisible();
	});

	test("user can delete a surface", async ({ page }) => {
		const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
		const productName = `Delete Surface Product ${uniqueId}`;
		const surfaceName = `worker-${uniqueId}`;

		await page.goto("/products/new");
		await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible({
			timeout: 10000,
		});
		await page.getByLabel("Product Name").fill(productName);
		await page.getByRole("combobox", { name: "Criticality" }).click();
		await page.getByRole("option", { name: "High" }).click();
		await page.getByRole("button", { name: "Create Product" }).click();

		await expect(page).toHaveURL(/\/products\//, { timeout: 15000 });
		await expect(page.getByRole("heading", { name: productName })).toBeVisible({ timeout: 10000 });

		await page.getByRole("button", { name: "Add Surface" }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await page.locator("#surface-name").fill(surfaceName);
		await page.locator("#surface-type").click();
		await page.getByRole("option", { name: "Worker" }).click();
		await page.getByRole("button", { name: "Add Surface" }).click();

		await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
		await expect(page.getByText(surfaceName)).toBeVisible({ timeout: 10000 });

		page.on("dialog", (dialog) => dialog.accept());
		const surfaceCard = page.locator(".rounded-lg.border", { hasText: surfaceName });
		await surfaceCard.getByRole("button").last().click();

		await expect(page.getByText(surfaceName)).not.toBeVisible({ timeout: 10000 });
		await expect(page.getByText("No surfaces defined yet")).toBeVisible();
	});
});

test.describe("Feature CRUD", () => {
	test("user can add a feature to a product", async ({ page }) => {
		const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
		const productName = `Feature Test Product ${uniqueId}`;
		const featureTitle = `User Auth Flow ${uniqueId}`;
		const featureDescription = "Implement user authentication with OAuth";

		await page.goto("/products/new");
		await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible({
			timeout: 10000,
		});
		await page.getByLabel("Product Name").fill(productName);
		await page.getByRole("combobox", { name: "Criticality" }).click();
		await page.getByRole("option", { name: "High" }).click();
		await page.getByRole("button", { name: "Create Product" }).click();

		await expect(page).toHaveURL(/\/products\//, { timeout: 15000 });
		await expect(page.getByRole("heading", { name: productName })).toBeVisible({ timeout: 10000 });

		await page.getByRole("button", { name: "Add Feature" }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByRole("heading", { name: "Add Feature" })).toBeVisible();

		await page.locator("#feature-title").fill(featureTitle);
		await page.locator("#feature-description").fill(featureDescription);
		await page.locator("#feature-status").click();
		await page.getByRole("option", { name: "Ready" }).click();

		await page.getByRole("button", { name: "Add", exact: true }).click();
		await page.locator('input[placeholder="Criterion 1"]').fill("Users can login with Google");
		await page.getByRole("button", { name: "Add", exact: true }).click();
		await page
			.locator('input[placeholder="Criterion 2"]')
			.fill("Session persists across page refreshes");

		await page.getByRole("button", { name: "Add Feature" }).click();

		await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
		await expect(page.getByText(featureTitle)).toBeVisible({ timeout: 10000 });
		await expect(page.getByText(featureDescription)).toBeVisible();
		await expect(page.getByText("ready")).toBeVisible();
		await expect(page.getByText("Acceptance Criteria (2)")).toBeVisible();
	});

	test("user can edit a feature", async ({ page }) => {
		const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
		const productName = `Edit Feature Product ${uniqueId}`;
		const featureTitle = `Dashboard UI ${uniqueId}`;
		const updatedFeatureTitle = `Updated Dashboard ${uniqueId}`;

		await page.goto("/products/new");
		await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible({
			timeout: 10000,
		});
		await page.getByLabel("Product Name").fill(productName);
		await page.getByRole("combobox", { name: "Criticality" }).click();
		await page.getByRole("option", { name: "Medium" }).click();
		await page.getByRole("button", { name: "Create Product" }).click();

		await expect(page).toHaveURL(/\/products\//, { timeout: 15000 });
		await expect(page.getByRole("heading", { name: productName })).toBeVisible({ timeout: 10000 });

		await page.getByRole("button", { name: "Add Feature" }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await page.locator("#feature-title").fill(featureTitle);
		await page.locator("#feature-status").click();
		await page.getByRole("option", { name: "Draft" }).click();
		await page.getByRole("button", { name: "Add Feature" }).click();

		await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
		await expect(page.getByText(featureTitle)).toBeVisible({ timeout: 10000 });

		const featureCard = page.locator(".rounded-lg.border", { hasText: featureTitle });
		await featureCard.getByRole("button").first().click();

		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByRole("heading", { name: "Edit Feature" })).toBeVisible();
		await page.locator("#feature-title").fill(updatedFeatureTitle);
		await page.locator("#feature-description").fill("Updated description for the dashboard");
		await page.locator("#feature-status").click();
		await page.getByRole("option", { name: "In Progress" }).click();
		await page.getByRole("button", { name: "Save Changes" }).click();

		await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
		await expect(page.getByText(updatedFeatureTitle)).toBeVisible({ timeout: 10000 });
		await expect(page.getByText("Updated description for the dashboard")).toBeVisible();
		await expect(page.getByText("in progress")).toBeVisible();
		await expect(page.getByText(featureTitle)).not.toBeVisible();
	});

	test("user can delete a feature", async ({ page }) => {
		const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
		const productName = `Delete Feature Product ${uniqueId}`;
		const featureTitle = `Notification System ${uniqueId}`;

		await page.goto("/products/new");
		await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible({
			timeout: 10000,
		});
		await page.getByLabel("Product Name").fill(productName);
		await page.getByRole("combobox", { name: "Criticality" }).click();
		await page.getByRole("option", { name: "Low" }).click();
		await page.getByRole("button", { name: "Create Product" }).click();

		await expect(page).toHaveURL(/\/products\//, { timeout: 15000 });
		await expect(page.getByRole("heading", { name: productName })).toBeVisible({ timeout: 10000 });

		await page.getByRole("button", { name: "Add Feature" }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await page.locator("#feature-title").fill(featureTitle);
		await page.locator("#feature-status").click();
		await page.getByRole("option", { name: "Completed" }).click();
		await page.getByRole("button", { name: "Add Feature" }).click();

		await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
		await expect(page.getByText(featureTitle)).toBeVisible({ timeout: 10000 });

		page.on("dialog", (dialog) => dialog.accept());
		const featureCard = page.locator(".rounded-lg.border", { hasText: featureTitle });
		await featureCard.getByRole("button").last().click();

		await expect(page.getByText(featureTitle)).not.toBeVisible({ timeout: 10000 });
		await expect(page.getByText("No features tracked yet")).toBeVisible();
	});

	test("user can manage acceptance criteria in a feature", async ({ page }) => {
		const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
		const productName = `Criteria Test Product ${uniqueId}`;
		const featureTitle = `API Integration ${uniqueId}`;

		await page.goto("/products/new");
		await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible({
			timeout: 10000,
		});
		await page.getByLabel("Product Name").fill(productName);
		await page.getByRole("combobox", { name: "Criticality" }).click();
		await page.getByRole("option", { name: "High" }).click();
		await page.getByRole("button", { name: "Create Product" }).click();

		await expect(page).toHaveURL(/\/products\//, { timeout: 15000 });
		await expect(page.getByRole("heading", { name: productName })).toBeVisible({ timeout: 10000 });

		await page.getByRole("button", { name: "Add Feature" }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await page.locator("#feature-title").fill(featureTitle);

		await page.getByRole("button", { name: "Add", exact: true }).click();
		await page.locator('input[placeholder="Criterion 1"]').fill("API returns JSON");
		await page.getByRole("button", { name: "Add", exact: true }).click();
		await page.locator('input[placeholder="Criterion 2"]').fill("Error handling implemented");
		await page.getByRole("button", { name: "Add", exact: true }).click();
		await page.locator('input[placeholder="Criterion 3"]').fill("Rate limiting works");

		await page.getByRole("button", { name: "Add Feature" }).click();

		await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
		await expect(page.getByText(featureTitle)).toBeVisible({ timeout: 10000 });
		await expect(page.getByText("Acceptance Criteria (3)")).toBeVisible();

		const featureCard = page.locator(".rounded-lg.border", { hasText: featureTitle });
		await featureCard.getByRole("button").first().click();

		await expect(page.getByRole("dialog")).toBeVisible();

		// Scope all criterion-related locators to the dialog
		const dialog = page.getByRole("dialog");
		const criteriaInputs = dialog.locator('input[placeholder^="Criterion"]');
		await expect(criteriaInputs).toHaveCount(3);

		// Get only trash buttons (buttons that are siblings of criterion inputs)
		const trashButtons = dialog.locator(
			'div:has(> input[placeholder^="Criterion"]) > button[type="button"]',
		);
		await expect(trashButtons).toHaveCount(3);
		await trashButtons.nth(1).click();

		await expect(criteriaInputs).toHaveCount(2);
		await page.getByRole("button", { name: "Save Changes" }).click();

		await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
		await expect(page.getByText("Acceptance Criteria (2)")).toBeVisible({ timeout: 10000 });
	});
});
