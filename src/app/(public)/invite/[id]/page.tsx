"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { organization, useSession } from "@/lib/auth-client";

export default function AcceptInvitationPage() {
	const router = useRouter();
	const params = useParams();
	const invitationId = params.id as string;
	const { data: session, isPending: sessionPending } = useSession();

	const [isAccepting, setIsAccepting] = useState(false);
	const [isRejecting, setIsRejecting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		if (!sessionPending && !session) {
			const returnUrl = encodeURIComponent(`/invite/${invitationId}`);
			router.push(`/login?returnUrl=${returnUrl}`);
		}
	}, [session, sessionPending, invitationId, router]);

	const handleAccept = async () => {
		setError(null);
		setIsAccepting(true);

		try {
			const result = await organization.acceptInvitation({ invitationId });

			if (result.error) {
				setError(result.error.message ?? "Failed to accept invitation");
				setIsAccepting(false);
				return;
			}

			setSuccess(true);
			setTimeout(() => {
				router.push("/dashboard");
			}, 2000);
		} catch {
			setError("An unexpected error occurred");
			setIsAccepting(false);
		}
	};

	const handleReject = async () => {
		setError(null);
		setIsRejecting(true);

		try {
			const result = await organization.rejectInvitation({ invitationId });

			if (result.error) {
				setError(result.error.message ?? "Failed to reject invitation");
				setIsRejecting(false);
				return;
			}

			router.push("/dashboard");
		} catch {
			setError("An unexpected error occurred");
			setIsRejecting(false);
		}
	};

	if (sessionPending) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p>Loading...</p>
			</div>
		);
	}

	if (!session) {
		return null;
	}

	if (success) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Welcome!</CardTitle>
						<CardDescription>You have successfully joined the organization.</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">Redirecting to dashboard...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Organization Invitation</CardTitle>
					<CardDescription>You have been invited to join an organization.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">
						Would you like to accept this invitation and join the organization?
					</p>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<div className="flex gap-4">
						<Button onClick={handleAccept} disabled={isAccepting || isRejecting} className="flex-1">
							{isAccepting ? "Accepting..." : "Accept"}
						</Button>
						<Button
							onClick={handleReject}
							disabled={isAccepting || isRejecting}
							variant="outline"
							className="flex-1"
						>
							{isRejecting ? "Rejecting..." : "Reject"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
