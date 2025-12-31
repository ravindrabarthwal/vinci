"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { OrganizationSwitcher } from "@/components/organization/organization-switcher";
import { useOrganization } from "@/components/providers/organization-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut, useSession } from "@/lib/auth-client";

export default function DashboardPage() {
	const router = useRouter();
	const { data: session, isPending } = useSession();
	const orgContext = useOrganization();

	const activeOrganization = orgContext?.activeOrganization;
	const hasOrganizations = orgContext?.hasOrganizations ?? false;
	const orgLoading = orgContext?.isLoading ?? true;

	useEffect(() => {
		if (!isPending && !session) {
			router.push("/login");
		}
	}, [session, isPending, router]);

	useEffect(() => {
		if (!isPending && !orgLoading && session && !hasOrganizations) {
			router.push("/org/new");
		}
	}, [session, isPending, orgLoading, hasOrganizations, router]);

	const handleSignOut = async () => {
		await signOut();
		router.push("/");
	};

	if (isPending || orgLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p>Loading...</p>
			</div>
		);
	}

	if (!session) {
		return null;
	}

	if (!hasOrganizations) {
		return null;
	}

	return (
		<div className="flex min-h-screen flex-col p-4">
			<header className="flex items-center justify-between border-b pb-4 mb-6">
				<OrganizationSwitcher />
				<Button onClick={handleSignOut} variant="outline">
					Sign Out
				</Button>
			</header>

			<div className="flex flex-1 items-center justify-center">
				<Card className="w-full max-w-lg">
					<CardHeader>
						<CardTitle>Dashboard</CardTitle>
						<CardDescription>Welcome to your protected dashboard</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-md bg-muted p-4 space-y-2">
							<p className="text-sm">
								<span className="font-medium">Signed in as:</span> {session.user.email}
							</p>
							{session.user.name && (
								<p className="text-sm">
									<span className="font-medium">Name:</span> {session.user.name}
								</p>
							)}
							{activeOrganization && (
								<p className="text-sm">
									<span className="font-medium">Organization:</span> {activeOrganization.name}
								</p>
							)}
						</div>
						<Button
							onClick={() => router.push("/org/settings")}
							variant="outline"
							className="w-full"
						>
							Manage Organization
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
