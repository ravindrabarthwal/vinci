"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useOrganization } from "@/components/providers/organization-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

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

	if (isPending || orgLoading) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
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
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Dashboard</h1>
				<p className="text-muted-foreground">Welcome to your protected dashboard</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle>Account</CardTitle>
						<CardDescription>Your account information</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="rounded-md bg-muted p-4 space-y-2">
							<p className="text-sm">
								<span className="font-medium">Email:</span> {session.user.email}
							</p>
							{session.user.name && (
								<p className="text-sm">
									<span className="font-medium">Name:</span> {session.user.name}
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				{activeOrganization && (
					<Card>
						<CardHeader>
							<CardTitle>Organization</CardTitle>
							<CardDescription>Your current organization</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="rounded-md bg-muted p-4">
								<p className="text-sm">
									<span className="font-medium">Name:</span> {activeOrganization.name}
								</p>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
