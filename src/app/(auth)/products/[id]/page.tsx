"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowLeftIcon, EditIcon, PlusIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useOrganization } from "@/components/providers/organization-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Criticality = "low" | "medium" | "high";
type SurfaceType = "repo" | "service" | "webapp" | "worker" | "infra";
type FeatureStatus = "draft" | "ready" | "in_progress" | "completed";

interface Product {
	_id: string;
	name: string;
	description?: string | null;
	criticality: Criticality;
	owners: string[];
}

interface Surface {
	_id: string;
	name: string;
	type: SurfaceType;
	location?: string | null;
	environments: Record<string, string>;
}

interface Feature {
	_id: string;
	title: string;
	description?: string | null;
	status: FeatureStatus;
	source: "manual" | "jira";
	acceptanceCriteria: string[];
}

interface ProductWithRelations extends Product {
	surfaces: Surface[];
	features: Feature[];
}

const criticalityColors: Record<Criticality, string> = {
	low: "bg-green-100 text-green-800",
	medium: "bg-yellow-100 text-yellow-800",
	high: "bg-red-100 text-red-800",
};

const surfaceTypeLabels: Record<SurfaceType, string> = {
	repo: "Repository",
	service: "Service",
	webapp: "Web App",
	worker: "Worker",
	infra: "Infrastructure",
};

const statusColors: Record<FeatureStatus, string> = {
	draft: "bg-gray-100 text-gray-800",
	ready: "bg-blue-100 text-blue-800",
	in_progress: "bg-purple-100 text-purple-800",
	completed: "bg-green-100 text-green-800",
};

export default function ProductDetailPage() {
	const params = useParams();
	const router = useRouter();
	const productId = params.id as string;

	const orgContext = useOrganization();
	const activeOrganization = orgContext?.activeOrganization;

	const [isDeleting, setIsDeleting] = useState(false);

	// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access
	const { api } = require("../../../../../convex/_generated/api");

	const product = useQuery(
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		api.products?.getWithRelations,
		activeOrganization ? { organizationId: activeOrganization.id, productId } : "skip",
	) as ProductWithRelations | null | undefined;

	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	const deleteProduct = useMutation(api.products?.remove);

	const handleDelete = async () => {
		if (!activeOrganization || !confirm("Are you sure you want to delete this product?")) return;

		setIsDeleting(true);
		try {
			await deleteProduct({
				organizationId: activeOrganization.id,
				productId,
			});
			router.push("/products");
		} catch (error) {
			console.error("Failed to delete product:", error);
			setIsDeleting(false);
		}
	};

	if (!activeOrganization) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>No Organization</CardTitle>
						<CardDescription>
							Please select or create an organization to view products.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	if (product === undefined) {
		return (
			<div className="container mx-auto max-w-4xl space-y-6 p-6">
				<Skeleton className="h-8 w-48" />
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-64" />
						<Skeleton className="h-4 w-96" />
					</CardHeader>
					<CardContent className="space-y-4">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (product === null) {
		return (
			<div className="container mx-auto max-w-4xl p-6">
				<Card>
					<CardHeader className="text-center">
						<CardTitle>Product Not Found</CardTitle>
						<CardDescription>
							The product you&apos;re looking for doesn&apos;t exist or you don&apos;t have access
							to it.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex justify-center">
						<Button asChild>
							<Link href="/products">
								<ArrowLeftIcon className="mr-2 h-4 w-4" />
								Back to Products
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-4xl space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/products">
							<ArrowLeftIcon className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-bold">{product.name}</h1>
							<span
								className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${criticalityColors[product.criticality]}`}
							>
								{product.criticality}
							</span>
						</div>
						{product.description && <p className="text-muted-foreground">{product.description}</p>}
					</div>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" asChild>
						<Link href={`/products/${productId}/edit`}>
							<EditIcon className="mr-2 h-4 w-4" />
							Edit
						</Link>
					</Button>
					<Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
						<TrashIcon className="mr-2 h-4 w-4" />
						{isDeleting ? "Deleting..." : "Delete"}
					</Button>
				</div>
			</div>

			{product.owners.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Owners</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							{product.owners.map((owner) => (
								<span key={owner} className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
									{owner}
								</span>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-lg">Surfaces</CardTitle>
						<CardDescription>
							Repositories, services, and deployable units for this product
						</CardDescription>
					</div>
					<Button size="sm" disabled>
						<PlusIcon className="mr-2 h-4 w-4" />
						Add Surface
					</Button>
				</CardHeader>
				<CardContent>
					{product.surfaces.length === 0 ? (
						<p className="text-center text-muted-foreground">No surfaces defined yet</p>
					) : (
						<div className="space-y-3">
							{product.surfaces.map((surface) => (
								<div
									key={surface._id}
									className="flex items-center justify-between rounded-lg border p-3"
								>
									<div>
										<div className="flex items-center gap-2">
											<span className="font-medium">{surface.name}</span>
											<span className="rounded bg-muted px-2 py-0.5 text-xs">
												{surfaceTypeLabels[surface.type]}
											</span>
										</div>
										{surface.location && (
											<p className="text-sm text-muted-foreground">{surface.location}</p>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-lg">Features</CardTitle>
						<CardDescription>Tracked features and requirements for this product</CardDescription>
					</div>
					<Button size="sm" disabled>
						<PlusIcon className="mr-2 h-4 w-4" />
						Add Feature
					</Button>
				</CardHeader>
				<CardContent>
					{product.features.length === 0 ? (
						<p className="text-center text-muted-foreground">No features tracked yet</p>
					) : (
						<div className="space-y-3">
							{product.features.map((feature) => (
								<div
									key={feature._id}
									className="flex items-center justify-between rounded-lg border p-3"
								>
									<div>
										<div className="flex items-center gap-2">
											<span className="font-medium">{feature.title}</span>
											<span
												className={`rounded-full px-2 py-0.5 text-xs ${statusColors[feature.status]}`}
											>
												{feature.status.replace("_", " ")}
											</span>
										</div>
										{feature.description && (
											<p className="text-sm text-muted-foreground">{feature.description}</p>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
