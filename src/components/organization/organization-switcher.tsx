"use client";

import { ChevronsUpDown, Plus, Settings } from "lucide-react";
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
import { organization } from "@/lib/auth-client";

export function OrganizationSwitcher() {
	const router = useRouter();
	const orgContext = useOrganization();

	const handleSwitchOrganization = async (orgId: string) => {
		await organization.setActive({ organizationId: orgId });
	};

	const handleCreateOrganization = () => {
		router.push("/org/new");
	};

	const handleManageOrganization = () => {
		router.push("/org/settings");
	};

	if (!orgContext) {
		return null;
	}

	const { activeOrganization, organizations, isLoading } = orgContext;

	if (isLoading) {
		return (
			<button
				type="button"
				disabled
				className="w-48 h-9 px-3 rounded-md border border-input bg-background text-sm opacity-50"
			>
				Loading...
			</button>
		);
	}

	const orgList = organizations ?? [];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="w-48 h-9 px-3 rounded-md border border-input bg-background text-sm flex items-center justify-between hover:bg-accent hover:text-accent-foreground"
				>
					<span className="truncate">{activeOrganization?.name ?? "Select Organization"}</span>
					<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-48">
				{orgList.length > 0 && (
					<>
						<DropdownMenuLabel>Organizations</DropdownMenuLabel>
						{orgList.map((org) => (
							<DropdownMenuItem
								key={org.id}
								onClick={() => handleSwitchOrganization(org.id)}
								className={activeOrganization?.id === org.id ? "bg-accent" : ""}
							>
								<span className="truncate">{org.name}</span>
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator />
					</>
				)}
				{activeOrganization && (
					<DropdownMenuItem onClick={handleManageOrganization}>
						<Settings className="mr-2 size-4" />
						Manage Organization
					</DropdownMenuItem>
				)}
				<DropdownMenuItem onClick={handleCreateOrganization}>
					<Plus className="mr-2 size-4" />
					Create Organization
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
