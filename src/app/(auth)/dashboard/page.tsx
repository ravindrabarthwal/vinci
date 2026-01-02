"use client";

import { useOrganization } from "@/components/providers/organization-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

export default function DashboardPage() {
	const { data: session } = useSession();
	const orgContext = useOrganization();

	const activeOrganization = orgContext?.activeOrganization;

	return (
		<div className="flex flex-1 items-center justify-center">
			<Card className="w-full max-w-lg">
				<CardHeader>
					<CardTitle>Dashboard</CardTitle>
					<CardDescription>Welcome to your protected dashboard</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-md bg-muted p-4 space-y-2">
						<p className="text-sm">
							<span className="font-medium">Signed in as:</span> {session?.user?.email}
						</p>
						{session?.user?.name && (
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
				</CardContent>
			</Card>
		</div>
	);
}
