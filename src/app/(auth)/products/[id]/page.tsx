"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowLeftIcon, EditIcon, PlusIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { FeatureDialog } from "@/components/products/feature-dialog";
import { NoOrganizationGuard } from "@/components/products/no-organization-guard";
import { SurfaceDialog } from "@/components/products/surface-dialog";
import {
	criticalityColors,
	type Feature,
	type ProductWithRelations,
	type Surface,
	statusColors,
	surfaceTypeLabels,
} from "@/components/products/types";
import { useOrganization } from "@/components/providers/organization-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingSkeleton() {
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

function ProductNotFound() {
	return (
		<div className="container mx-auto max-w-4xl p-6">
			<Card>
				<CardHeader className="text-center">
					<CardTitle>Product Not Found</CardTitle>
					<CardDescription>
						The product you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to
						it.
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

type SurfaceDialogState =
	| { open: false }
	| { open: true; mode: "create" }
	| { open: true; mode: "edit"; surface: Surface };

type FeatureDialogState =
	| { open: false }
	| { open: true; mode: "create" }
	| { open: true; mode: "edit"; feature: Feature };

export default function ProductDetailPage() {
	const params = useParams();
	const router = useRouter();
	const productId = params.id as string;

	const orgContext = useOrganization();
	const activeOrganization = orgContext?.activeOrganization;

	const [isDeleting, setIsDeleting] = useState(false);
	const [surfaceDialog, setSurfaceDialog] = useState<SurfaceDialogState>({ open: false });
	const [featureDialog, setFeatureDialog] = useState<FeatureDialogState>({ open: false });
	const [deletingSurfaceId, setDeletingSurfaceId] = useState<string | null>(null);
	const [deletingFeatureId, setDeletingFeatureId] = useState<string | null>(null);

	// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access
	const { api } = require("../../../../../convex/_generated/api");

	const product = useQuery(
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		api.products?.getWithRelations,
		activeOrganization ? { organizationId: activeOrganization.id, productId } : "skip",
	) as ProductWithRelations | null | undefined;

	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	const deleteProduct = useMutation(api.products?.remove);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	const removeSurface = useMutation(api.products?.removeSurface);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	const removeFeature = useMutation(api.products?.removeFeature);

	const handleDeleteProduct = async () => {
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

	const handleDeleteSurface = async (surfaceId: string) => {
		if (!activeOrganization || !confirm("Are you sure you want to delete this surface?")) return;

		setDeletingSurfaceId(surfaceId);
		try {
			await removeSurface({
				surfaceId,
				organizationId: activeOrganization.id,
			});
		} catch (error) {
			console.error("Failed to delete surface:", error);
		} finally {
			setDeletingSurfaceId(null);
		}
	};

	const handleDeleteFeature = async (featureId: string) => {
		if (!activeOrganization || !confirm("Are you sure you want to delete this feature?")) return;

		setDeletingFeatureId(featureId);
		try {
			await removeFeature({
				featureId,
				organizationId: activeOrganization.id,
			});
		} catch (error) {
			console.error("Failed to delete feature:", error);
		} finally {
			setDeletingFeatureId(null);
		}
	};

	if (!activeOrganization) {
		return <NoOrganizationGuard action="view products" />;
	}

	if (product === undefined) {
		return <LoadingSkeleton />;
	}

	if (product === null) {
		return <ProductNotFound />;
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
					<Button variant="destructive" onClick={handleDeleteProduct} disabled={isDeleting}>
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
					<Button size="sm" onClick={() => setSurfaceDialog({ open: true, mode: "create" })}>
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
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setSurfaceDialog({ open: true, mode: "edit", surface })}
										>
											<EditIcon className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDeleteSurface(surface._id)}
											disabled={deletingSurfaceId === surface._id}
										>
											<TrashIcon className="h-4 w-4 text-destructive" />
										</Button>
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
					<Button size="sm" onClick={() => setFeatureDialog({ open: true, mode: "create" })}>
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
									<div className="flex-1">
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
										{feature.acceptanceCriteria.length > 0 && (
											<div className="mt-2">
												<p className="text-xs font-medium text-muted-foreground">
													Acceptance Criteria ({feature.acceptanceCriteria.length})
												</p>
											</div>
										)}
									</div>
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setFeatureDialog({ open: true, mode: "edit", feature })}
										>
											<EditIcon className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDeleteFeature(feature._id)}
											disabled={deletingFeatureId === feature._id}
										>
											<TrashIcon className="h-4 w-4 text-destructive" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<SurfaceDialog
				open={surfaceDialog.open}
				onOpenChange={(open) => {
					if (!open) setSurfaceDialog({ open: false });
				}}
				mode={surfaceDialog.open ? surfaceDialog.mode : "create"}
				productId={productId}
				organizationId={activeOrganization.id}
				initialData={
					surfaceDialog.open && surfaceDialog.mode === "edit" ? surfaceDialog.surface : undefined
				}
			/>

			<FeatureDialog
				open={featureDialog.open}
				onOpenChange={(open) => {
					if (!open) setFeatureDialog({ open: false });
				}}
				mode={featureDialog.open ? featureDialog.mode : "create"}
				productId={productId}
				organizationId={activeOrganization.id}
				initialData={
					featureDialog.open && featureDialog.mode === "edit" ? featureDialog.feature : undefined
				}
			/>
		</div>
	);
}
