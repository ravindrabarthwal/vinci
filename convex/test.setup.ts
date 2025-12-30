import { vi } from "vitest";

vi.mock("convex/server", async () => {
	const actual = await vi.importActual("convex/server");
	return {
		...actual,
	};
});
