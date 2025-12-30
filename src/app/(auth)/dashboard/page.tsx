"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut, useSession } from "@/lib/auth-client";

export default function DashboardPage() {
	const router = useRouter();
	const { data: session, isPending } = useSession();

	useEffect(() => {
		if (!isPending && !session) {
			router.push("/login");
		}
	}, [session, isPending, router]);

	const handleSignOut = async () => {
		await signOut();
		router.push("/");
	};

	if (isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p>Loading...</p>
			</div>
		);
	}

	if (!session) {
		return null;
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-lg">
				<CardHeader>
					<CardTitle>Dashboard</CardTitle>
					<CardDescription>Welcome to your protected dashboard</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-md bg-muted p-4">
						<p className="text-sm">
							<span className="font-medium">Signed in as:</span> {session.user.email}
						</p>
						{session.user.name && (
							<p className="text-sm">
								<span className="font-medium">Name:</span> {session.user.name}
							</p>
						)}
					</div>
					<Button onClick={handleSignOut} variant="outline" className="w-full">
						Sign Out
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
