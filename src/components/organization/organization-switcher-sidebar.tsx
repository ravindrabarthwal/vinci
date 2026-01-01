"use client";

import {
	Add01Icon,
	ArrowDown01Icon,
	Building06Icon,
	CheckmarkCircle02Icon,
	Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/components/providers/organization-provider";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { organization } from "@/lib/auth-client";

export function OrganizationSwitcherSidebar() {
	const router = useRouter();
	const orgContext = useOrganization();
	const { isMobile } = useSidebar();

	const handleSwitchOrganization = async (orgId: string) => {
		await organization.setActive({ organizationId: orgId });
	};

	const handleCreateOrganization = () => {
		router.push("/org/new");
	};

	const handleSettingsClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();
		if (orgContext?.activeOrganization?.slug) {
			router.push(`/org/${orgContext.activeOrganization.slug}/settings`);
		} else {
			router.push("/org/settings");
		}
	};

	if (!orgContext) {
		return null;
	}

	const { activeOrganization, organizations, isLoading } = orgContext;

	if (isLoading) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<div className="flex items-center gap-2 px-2 py-1.5">
						<Skeleton className="h-8 w-8" />
						<div className="flex-1 space-y-1">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-3 w-16" />
						</div>
					</div>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	const orgList = organizations ?? [];

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							/>
						}
					>
						<div className="flex aspect-square size-8 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground">
							<HugeiconsIcon icon={Building06Icon} size={16} />
						</div>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-semibold">
								{activeOrganization?.name ?? "Select Organization"}
							</span>
							<span className="truncate text-xs text-muted-foreground">
								{activeOrganization ? "Active" : "No org selected"}
							</span>
						</div>
						<HugeiconsIcon icon={ArrowDown01Icon} className="ml-auto" size={16} />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-xs text-muted-foreground">
							Organizations
						</DropdownMenuLabel>
						{orgList.map((org) => (
							<DropdownMenuItem
								key={org.id}
								onClick={() => handleSwitchOrganization(org.id)}
								className="gap-2 p-2"
							>
								<div className="flex size-6 items-center justify-center border bg-background">
									<HugeiconsIcon icon={Building06Icon} size={14} />
								</div>
								<span className="flex-1 truncate">{org.name}</span>
								{activeOrganization?.id === org.id && (
									<HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-primary" />
								)}
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator />
						{activeOrganization && (
							<DropdownMenuItem onClick={handleSettingsClick} className="gap-2 p-2">
								<div className="flex size-6 items-center justify-center border bg-background">
									<HugeiconsIcon icon={Settings01Icon} size={14} />
								</div>
								<span>Organization Settings</span>
							</DropdownMenuItem>
						)}
						<DropdownMenuItem onClick={handleCreateOrganization} className="gap-2 p-2">
							<div className="flex size-6 items-center justify-center border bg-background">
								<HugeiconsIcon icon={Add01Icon} size={14} />
							</div>
							<span>Create Organization</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
