"use client";

import { LayoutDashboardIcon, LogOutIcon, PlusIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { OrganizationSwitcher } from "@/components/organization/organization-switcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { signOut, useSession } from "@/lib/auth-client";

export function AppSidebar() {
	const pathname = usePathname();
	const router = useRouter();
	const { data: session } = useSession();

	const handleSignOut = async () => {
		await signOut();
		router.push("/");
	};

	return (
		<Sidebar>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<div className="px-2 py-1">
							<OrganizationSwitcher />
						</div>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
									<Link href="/dashboard">
										<LayoutDashboardIcon />
										<span>Dashboard</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<Link href="/org/new">
								<PlusIcon />
								<span>New Organization</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton asChild isActive={pathname === "/org/settings"}>
							<Link href="/org/settings">
								<SettingsIcon />
								<span>Settings</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton onClick={handleSignOut}>
							<LogOutIcon />
							<span>Sign Out</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
				{session?.user?.email && (
					<div className="px-4 py-2 text-xs text-muted-foreground truncate">
						{session.user.email}
					</div>
				)}
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
