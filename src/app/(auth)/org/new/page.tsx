"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { organization } from "@/lib/auth-client";

function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

export default function CreateOrganizationPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [isSlugManual, setIsSlugManual] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleNameChange = (value: string) => {
		setName(value);
		if (!isSlugManual) {
			setSlug(generateSlug(value));
		}
	};

	const handleSlugChange = (value: string) => {
		setSlug(value);
		setIsSlugManual(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const result = await organization.create({
				name: name.trim(),
				slug: slug.trim(),
			});

			if (result.error) {
				setError(result.error.message ?? "Failed to create organization");
				setIsSubmitting(false);
				return;
			}

			await organization.setActive({ organizationId: result.data.id });
			router.push("/dashboard");
		} catch {
			setError("An unexpected error occurred");
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Create Organization</CardTitle>
					<CardDescription>
						Create a new organization to get started. You can invite team members later.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Organization Name</Label>
							<Input
								id="name"
								type="text"
								placeholder="Acme Inc"
								value={name}
								onChange={(e) => handleNameChange(e.target.value)}
								required
								disabled={isSubmitting}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="slug">URL Slug</Label>
							<Input
								id="slug"
								type="text"
								placeholder="acme-inc"
								value={slug}
								onChange={(e) => handleSlugChange(e.target.value)}
								required
								disabled={isSubmitting}
								pattern="[a-z0-9-]+"
								title="Only lowercase letters, numbers, and hyphens"
							/>
							<p className="text-xs text-muted-foreground">
								This will be used in URLs. Only lowercase letters, numbers, and hyphens.
							</p>
						</div>
						{error && <p className="text-sm text-destructive">{error}</p>}
						<Button
							type="submit"
							className="w-full"
							disabled={isSubmitting || !name.trim() || !slug.trim()}
						>
							{isSubmitting ? "Creating..." : "Create Organization"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
