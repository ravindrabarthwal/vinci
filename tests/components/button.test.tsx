import { describe, expect, test } from "bun:test";
import { Button } from "@/components/ui/button";
import { render, screen } from "../setup/test-utils";

describe("Button component", () => {
	test("#given default variant #when rendered #then displays correctly", async () => {
		render(<Button>Click me</Button>);
		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toBeDefined();
	});

	test("#given variant prop #when destructive #then applies destructive styles", async () => {
		render(<Button variant="destructive">Delete</Button>);
		const button = screen.getByRole("button", { name: /delete/i });
		expect(button.className).toContain("destructive");
	});

	test("#given disabled prop #when true #then button is disabled", async () => {
		render(<Button disabled>Disabled</Button>);
		const button = screen.getByRole("button", { name: /disabled/i });
		expect(button).toHaveProperty("disabled", true);
	});

	test("#given asChild prop #when true #then renders child element", async () => {
		render(
			<Button asChild>
				<a href="/test">Link Button</a>
			</Button>,
		);
		const link = screen.getByRole("link", { name: /link button/i });
		expect(link).toBeDefined();
		expect(link.getAttribute("href")).toBe("/test");
	});
});
