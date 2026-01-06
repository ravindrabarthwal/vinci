"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface NoOrganizationGuardProps {
	readonly action: string;
}

export function NoOrganizationGuard({ action }: NoOrganizationGuardProps) {
	return (
		<div className="flex flex-1 items-center justify-center">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>No Organization</CardTitle>
					<CardDescription>Please select or create an organization to {action}.</CardDescription>
				</CardHeader>
			</Card>
		</div>
	);
}
