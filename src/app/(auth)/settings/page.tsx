"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut, useSession } from "@/lib/auth-client";

export default function UserSettingsPage() {
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
			<div className="flex min-h-[50vh] items-center justify-center">
				<p>Loading...</p>
			</div>
		);
	}

	if (!session) {
		return null;
	}

	return (
		<div className="container mx-auto max-w-2xl space-y-6">
			<div>
				<h1 className="text-2xl font-bold">User Settings</h1>
				<p className="text-muted-foreground">Manage your account settings</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Profile</CardTitle>
					<CardDescription>Your account information</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<p className="text-sm font-medium">Email</p>
						<p className="text-sm text-muted-foreground">{session.user.email}</p>
					</div>
					{session.user.name && (
						<div className="space-y-2">
							<p className="text-sm font-medium">Name</p>
							<p className="text-sm text-muted-foreground">{session.user.name}</p>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Account</CardTitle>
					<CardDescription>Sign out of your account</CardDescription>
				</CardHeader>
				<CardContent>
					<Button variant="destructive" onClick={handleSignOut}>
						Sign Out
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
