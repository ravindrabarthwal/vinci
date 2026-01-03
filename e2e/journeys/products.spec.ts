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
