"use client";

import { Building2Icon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
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

export function TeamSwitcher() {
	const router = useRouter();
	const { isMobile } = useSidebar();
	const orgContext = useOrganization();

	const handleSwitchOrganization = async (orgId: string) => {
		await organization.setActive({ organizationId: orgId });
	};

	const handleCreateOrganization = () => {
		router.push("/org/new");
	};

	if (!orgContext) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton size="lg" className="pointer-events-none">
						<Skeleton className="size-8 rounded-lg" />
						<div className="grid flex-1 gap-1 text-left">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-3 w-16" />
						</div>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	const { activeOrganization, organizations, isLoading } = orgContext;

	if (isLoading) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton size="lg" className="pointer-events-none">
						<Skeleton className="size-8 rounded-lg" />
						<div className="grid flex-1 gap-1 text-left">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-3 w-16" />
						</div>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	const orgList = organizations ?? [];

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
								<Building2Icon className="size-4" />
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">
									{activeOrganization?.name ?? "Select Organization"}
								</span>
								<span className="truncate text-xs text-muted-foreground">
									{activeOrganization ? "Member" : "No organization"}
								</span>
							</div>
							<ChevronsUpDownIcon className="ml-auto" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						{orgList.length > 0 && (
							<>
								<DropdownMenuLabel className="text-xs text-muted-foreground">
									Organizations
								</DropdownMenuLabel>
								{orgList.map((org) => (
									<DropdownMenuItem
										key={org.id}
										onClick={() => handleSwitchOrganization(org.id)}
										className="gap-2 p-2"
									>
										<div className="flex size-6 items-center justify-center rounded-sm border">
											<Building2Icon className="size-4 shrink-0" />
										</div>
										<span className="truncate">{org.name}</span>
										{activeOrganization?.id === org.id && (
											<span className="ml-auto text-xs text-muted-foreground">Active</span>
										)}
									</DropdownMenuItem>
								))}
								<DropdownMenuSeparator />
							</>
						)}
						<DropdownMenuItem onClick={handleCreateOrganization} className="gap-2 p-2">
							<div className="bg-background flex size-6 items-center justify-center rounded-md border">
								<PlusIcon className="size-4" />
							</div>
							<span className="font-medium text-muted-foreground">Add organization</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
