"use client";

import { type ReactNode, useEffect } from "react";
import { initClientErrorHandlers } from "@/lib/logging/logger-client";

export function ErrorHandlerProvider({ children }: { children: ReactNode }) {
	useEffect(() => {
		initClientErrorHandlers();
	}, []);

	return <>{children}</>;
}
