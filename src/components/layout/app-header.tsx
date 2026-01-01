"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";

function getInitials(user: { name?: string | null; email?: string | null } | undefined): string {
	if (!user) return "?";
	if (user.name) {
		const parts = user.name.split(" ");
		if (parts.length >= 2) {
			return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
		}
		return user.name.slice(0, 2).toUpperCase();
	}
	if (user.email) {
		return user.email.slice(0, 2).toUpperCase();
	}
	return "?";
}

export function AppHeader() {
	const { data: session } = useSession();

	const initials = getInitials(session?.user);
	const userImage = session?.user?.image;

	return (
		<header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
			<div className="flex items-center gap-2">
				<SidebarTrigger className="-ml-1" />
				<Separator orientation="vertical" className="mr-2 h-4" />
				<span className="font-semibold text-lg">Vinci</span>
			</div>
			<Link
				href="/settings"
				className="flex items-center gap-2 hover:opacity-80 transition-opacity"
				title="User Settings"
			>
				<Avatar className="h-8 w-8">
					{userImage && <AvatarImage src={userImage} alt={session?.user?.name ?? "User"} />}
					<AvatarFallback className="text-xs">{initials}</AvatarFallback>
				</Avatar>
			</Link>
		</header>
	);
}
