import { type RenderOptions, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";

function AllTheProviders({ children }: { children: ReactNode }) {
	return <>{children}</>;
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
	return {
		user: userEvent.setup(),
		...render(ui, { wrapper: AllTheProviders, ...options }),
	};
}

export * from "@testing-library/react";
export { userEvent };
export { customRender as render };
