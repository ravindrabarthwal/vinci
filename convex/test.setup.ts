/// <reference types="vite/client" />
import { vi } from "vitest";

vi.mock("convex/server", async () => {
	const actual = await vi.importActual("convex/server");
	return {
		...actual,
	};
});

/**
 * Modules glob for convex-test.
 * Required by convexTest() to find Convex functions.
 * See: https://docs.convex.dev/testing/convex-test#get-started
 */
export const modules = import.meta.glob("./**/!(*.*.*)*.*s");
