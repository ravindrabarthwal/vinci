"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOrganization } from "@/components/providers/organization-provider";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type Criticality = "low" | "medium" | "high";

interface ProductFormProps {
	mode: "create" | "edit";
	initialData?: {
		_id: string;
		name: string;
		description?: string | null;
		criticality: Criticality;
		owners: string[];
	};
}

export function ProductForm({ mode, initialData }: ProductFormProps) {
	const router = useRouter();
	const orgContext = useOrganization();
	const activeOrganization = orgContext?.activeOrganization;

	const [name, setName] = useState(initialData?.name ?? "");
	const [description, setDescription] = useState(initialData?.description ?? "");
	const [criticality, setCriticality] = useState<Criticality>(initialData?.criticality ?? "medium");
	const [owners, setOwners] = useState(initialData?.owners.join(", ") ?? "");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access
	const { api } = require("../../../convex/_generated/api");
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	const createProduct = useMutation(api.products?.create);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	const updateProduct = useMutation(api.products?.update);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!activeOrganization) return;

		setError(null);
		setIsSubmitting(true);

		const ownersArray = owners
			.split(",")
			.map((o) => o.trim())
			.filter(Boolean);

		try {
			if (mode === "create") {
				const productId = await createProduct({
					organizationId: activeOrganization.id,
					name: name.trim(),
					description: description.trim() || undefined,
					criticality,
					owners: ownersArray,
				});
				router.push(`/products/${productId}`);
			} else if (initialData) {
				await updateProduct({
					productId: initialData._id,
					name: name.trim(),
					description: description.trim() || null,
					criticality,
					owners: ownersArray,
				});
				router.push(`/products/${initialData._id}`);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "An unexpected error occurred");
			setIsSubmitting(false);
		}
	};

	if (!activeOrganization) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>No Organization</CardTitle>
						<CardDescription>
							Please select or create an organization to manage products.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor="name">Product Name</Label>
				<Input
					id="name"
					type="text"
					placeholder="My Product"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
					disabled={isSubmitting}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Description</Label>
				<Input
					id="description"
					type="text"
					placeholder="Brief description of the product"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					disabled={isSubmitting}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="criticality">Criticality</Label>
				<Select
					value={criticality}
					onValueChange={(value) => setCriticality(value as Criticality)}
					disabled={isSubmitting}
				>
					<SelectTrigger id="criticality">
						<SelectValue placeholder="Select criticality" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="low">Low</SelectItem>
						<SelectItem value="medium">Medium</SelectItem>
						<SelectItem value="high">High</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label htmlFor="owners">Owners</Label>
				<Input
					id="owners"
					type="text"
					placeholder="owner1, owner2"
					value={owners}
					onChange={(e) => setOwners(e.target.value)}
					disabled={isSubmitting}
				/>
				<p className="text-xs text-muted-foreground">Comma-separated list of owner identifiers</p>
			</div>

			{error && <p className="text-sm text-destructive">{error}</p>}

			<div className="flex gap-4">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.back()}
					disabled={isSubmitting}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting || !name.trim()}>
					{isSubmitting
						? mode === "create"
							? "Creating..."
							: "Saving..."
						: mode === "create"
							? "Create Product"
							: "Save Changes"}
				</Button>
			</div>
		</form>
	);
}
