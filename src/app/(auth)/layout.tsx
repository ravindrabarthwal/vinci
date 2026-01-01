import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AuthLayout({ children }: { children: ReactNode }) {
	const cookieStore = await cookies();
	const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

	return (
		<SidebarProvider defaultOpen={defaultOpen}>
			<AppSidebar />
			<SidebarInset>
				<AppHeader />
				<main className="flex-1 p-4">{children}</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
