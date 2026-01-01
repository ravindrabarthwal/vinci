"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOrganization } from "@/components/providers/organization-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { organization, useSession } from "@/lib/auth-client";

type MemberRole = "owner" | "admin" | "member";

interface Member {
	id: string;
	userId: string;
	role: MemberRole;
	user: {
		name: string;
		email: string;
	};
}

interface Invitation {
	id: string;
	email: string;
	role: MemberRole;
	status: string;
}

export default function OrganizationSettingsPage() {
	const { data: session } = useSession();
	const router = useRouter();
	const orgContext = useOrganization();
	const activeOrganization = orgContext?.activeOrganization;

	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState<MemberRole>("member");
	const [isInviting, setIsInviting] = useState(false);
	const [inviteError, setInviteError] = useState<string | null>(null);
	const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

	const [members, setMembers] = useState<Member[]>([]);
	const [invitations, setInvitations] = useState<Invitation[]>([]);
	const [isLoadingMembers, setIsLoadingMembers] = useState(false);

	const loadMembers = async () => {
		if (!activeOrganization) return;
		setIsLoadingMembers(true);
		try {
			const result = await organization.getFullOrganization();
			if (result.data) {
				setMembers(result.data.members as Member[]);
				setInvitations(result.data.invitations as Invitation[]);
			}
		} finally {
			setIsLoadingMembers(false);
		}
	};

	const handleInvite = async (e: React.FormEvent) => {
		e.preventDefault();
		setInviteError(null);
		setInviteSuccess(null);
		setIsInviting(true);

		try {
			const result = await organization.inviteMember({
				email: inviteEmail.trim(),
				role: inviteRole,
			});

			if (result.error) {
				setInviteError(result.error.message ?? "Failed to send invitation");
				setIsInviting(false);
				return;
			}

			setInviteSuccess(`Invitation sent to ${inviteEmail}`);
			setInviteEmail("");
			await loadMembers();
		} catch {
			setInviteError("An unexpected error occurred");
		} finally {
			setIsInviting(false);
		}
	};

	const handleCancelInvitation = async (invitationId: string) => {
		try {
			await organization.cancelInvitation({ invitationId });
			await loadMembers();
		} catch {
			setInviteError("Failed to cancel invitation");
		}
	};

	const handleRemoveMember = async (memberUserId: string) => {
		try {
			await organization.removeMember({ memberIdOrEmail: memberUserId });
			await loadMembers();
		} catch {
			setInviteError("Failed to remove member");
		}
	};

	const handleLeaveOrganization = async () => {
		if (!activeOrganization) return;
		if (!confirm("Are you sure you want to leave this organization?")) return;

		try {
			await organization.leave({ organizationId: activeOrganization.id });
			router.push("/dashboard");
		} catch {
			setInviteError("Failed to leave organization");
		}
	};

	if (!session || !activeOrganization) {
		return null;
	}

	const currentMember = members.find((m) => m.userId === session.user.id);
	const isOwner = currentMember?.role === "owner";
	const isAdmin = currentMember?.role === "admin" || isOwner;

	return (
		<div className="container mx-auto max-w-4xl space-y-6">
			<div>
				<h1 className="text-2xl font-bold">{activeOrganization.name}</h1>
				<p className="text-muted-foreground">Organization Settings</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Invite Member</CardTitle>
					<CardDescription>
						Send an invitation to add a new member to your organization.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleInvite} className="flex gap-4">
						<div className="flex-1 space-y-2">
							<Label htmlFor="email">Email Address</Label>
							<Input
								id="email"
								type="email"
								placeholder="colleague@example.com"
								value={inviteEmail}
								onChange={(e) => setInviteEmail(e.target.value)}
								required
								disabled={isInviting}
							/>
						</div>
						<div className="w-32 space-y-2">
							<Label htmlFor="role">Role</Label>
							<select
								id="role"
								value={inviteRole}
								onChange={(e) => setInviteRole(e.target.value as MemberRole)}
								disabled={isInviting}
								className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
							>
								<option value="member">Member</option>
								<option value="admin">Admin</option>
							</select>
						</div>
						<div className="flex items-end">
							<Button type="submit" disabled={isInviting || !inviteEmail.trim()}>
								{isInviting ? "Sending..." : "Invite"}
							</Button>
						</div>
					</form>
					{inviteError && <p className="mt-2 text-sm text-destructive">{inviteError}</p>}
					{inviteSuccess && <p className="mt-2 text-sm text-green-600">{inviteSuccess}</p>}
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Members</CardTitle>
						<CardDescription>Manage organization members and their roles.</CardDescription>
					</div>
					<Button variant="outline" size="sm" onClick={loadMembers} disabled={isLoadingMembers}>
						{isLoadingMembers ? "Loading..." : "Refresh"}
					</Button>
				</CardHeader>
				<CardContent>
					{members.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Click &ldquo;Refresh&rdquo; to load members.
						</p>
					) : (
						<div className="space-y-2">
							{members.map((member) => (
								<div
									key={member.id}
									className="flex items-center justify-between p-3 rounded-md bg-muted"
								>
									<div>
										<p className="font-medium">{member.user.name}</p>
										<p className="text-sm text-muted-foreground">{member.user.email}</p>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xs bg-background px-2 py-1 rounded capitalize">
											{member.role}
										</span>
										{isAdmin && member.userId !== session.user.id && member.role !== "owner" && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleRemoveMember(member.userId)}
											>
												Remove
											</Button>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Pending Invitations</CardTitle>
					<CardDescription>Invitations that have been sent but not yet accepted.</CardDescription>
				</CardHeader>
				<CardContent>
					{invitations.length === 0 ? (
						<p className="text-muted-foreground text-sm">No pending invitations.</p>
					) : (
						<div className="space-y-2">
							{invitations.map((invite) => (
								<div
									key={invite.id}
									className="flex items-center justify-between p-3 rounded-md bg-muted"
								>
									<div>
										<p className="font-medium">{invite.email}</p>
										<p className="text-sm text-muted-foreground capitalize">
											Role: {invite.role} • Status: {invite.status}
										</p>
									</div>
									{isAdmin && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleCancelInvitation(invite.id)}
										>
											Cancel
										</Button>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{!isOwner && (
				<Card>
					<CardHeader>
						<CardTitle>Leave Organization</CardTitle>
						<CardDescription>Remove yourself from this organization.</CardDescription>
					</CardHeader>
					<CardContent>
						<Button variant="destructive" onClick={handleLeaveOrganization}>
							Leave Organization
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
