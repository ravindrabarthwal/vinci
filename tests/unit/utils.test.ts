import { describe, expect, test } from "bun:test";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
	test("#given multiple class names #when called #then merges them correctly", () => {
		const result = cn("px-4", "py-2", "bg-blue-500");
		expect(result).toBe("px-4 py-2 bg-blue-500");
	});

	test("#given conflicting tailwind classes #when called #then last one wins", () => {
		const result = cn("bg-red-500", "bg-blue-500");
		expect(result).toBe("bg-blue-500");
	});

	test("#given conditional classes #when falsy #then excludes them", () => {
		const isActive = false;
		const result = cn("base-class", isActive && "active-class");
		expect(result).toBe("base-class");
	});

	test("#given conditional classes #when truthy #then includes them", () => {
		const isActive = true;
		const result = cn("base-class", isActive && "active-class");
		expect(result).toBe("base-class active-class");
	});
});
