"use client";

import { useQuery } from "convex/react";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { NoOrganizationGuard } from "@/components/products/no-organization-guard";
import { ProductForm } from "@/components/products/product-form";
import type { Product } from "@/components/products/types";
import { useOrganization } from "@/components/providers/organization-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingSkeleton() {
	return (
		<div className="container mx-auto max-w-2xl p-6">
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent className="space-y-4">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</CardContent>
			</Card>
		</div>
	);
}

function ProductNotFound() {
	return (
		<div className="container mx-auto max-w-2xl p-6">
			<Card>
				<CardHeader className="text-center">
					<CardTitle>Product Not Found</CardTitle>
					<CardDescription>
						The product you&apos;re trying to edit doesn&apos;t exist or you don&apos;t have access
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

export default function EditProductPage() {
	const params = useParams();
	const productId = params.id as string;

	const orgContext = useOrganization();
	const activeOrganization = orgContext?.activeOrganization;

	// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access
	const { api } = require("../../../../../../convex/_generated/api");

	const product = useQuery(
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		api.products?.get,
		activeOrganization ? { organizationId: activeOrganization.id, productId } : "skip",
	) as Product | null | undefined;

	if (!activeOrganization) {
		return <NoOrganizationGuard action="edit products" />;
	}

	if (product === undefined) {
		return <LoadingSkeleton />;
	}

	if (product === null) {
		return <ProductNotFound />;
	}

	return (
		<div className="container mx-auto max-w-2xl p-6">
			<Card>
				<CardHeader>
					<div className="flex items-center gap-4">
						<Button variant="ghost" size="icon" asChild>
							<Link href={`/products/${productId}`}>
								<ArrowLeftIcon className="h-4 w-4" />
							</Link>
						</Button>
						<div>
							<CardTitle>Edit Product</CardTitle>
							<CardDescription>Update product details</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<ProductForm mode="edit" initialData={product} />
				</CardContent>
			</Card>
		</div>
	);
}
