"use client";

import { Folder01Icon, Home01Icon, UserMultiple02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganizationSwitcherSidebar } from "@/components/organization/organization-switcher-sidebar";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";

const navItems = [
	{ title: "Dashboard", href: "/dashboard", icon: Home01Icon },
	{ title: "Projects", href: "#", icon: Folder01Icon, disabled: true },
	{ title: "Team", href: "#", icon: UserMultiple02Icon, disabled: true },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<OrganizationSwitcherSidebar />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => {
								const isActive = pathname === item.href;
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											asChild={!item.disabled}
											isActive={isActive}
											tooltip={item.title}
											disabled={item.disabled}
										>
											{item.disabled ? (
												<span className="opacity-50 cursor-not-allowed">
													<HugeiconsIcon icon={item.icon} />
													<span>{item.title}</span>
												</span>
											) : (
												<Link href={item.href}>
													<HugeiconsIcon icon={item.icon} />
													<span>{item.title}</span>
												</Link>
											)}
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
