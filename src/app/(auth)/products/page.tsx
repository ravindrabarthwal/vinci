"use client";

import { useQuery } from "convex/react";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { NoOrganizationGuard } from "@/components/products/no-organization-guard";
import { criticalityColors, type Product } from "@/components/products/types";
import { useOrganization } from "@/components/providers/organization-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingSkeleton() {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{[1, 2, 3].map((i) => (
				<Card key={i}>
					<CardHeader>
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-4 w-48" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-4 w-16" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function EmptyState() {
	return (
		<Card>
			<CardHeader className="text-center">
				<CardTitle>No products yet</CardTitle>
				<CardDescription>
					Get started by creating your first product to track its surfaces and features.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex justify-center">
				<Button asChild>
					<Link href="/products/new">
						<PlusIcon className="mr-2 h-4 w-4" />
						Create your first product
					</Link>
				</Button>
			</CardContent>
		</Card>
	);
}

function ProductCard({ product }: Readonly<{ product: Product }>) {
	return (
		<Link href={`/products/${product._id}`}>
			<Card className="cursor-pointer transition-colors hover:bg-muted/50">
				<CardHeader>
					<div className="flex items-start justify-between">
						<CardTitle className="text-lg">{product.name}</CardTitle>
						<span
							className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${criticalityColors[product.criticality]}`}
						>
							{product.criticality}
						</span>
					</div>
					{product.description && (
						<CardDescription className="line-clamp-2">{product.description}</CardDescription>
					)}
				</CardHeader>
				<CardContent>
					<p className="text-xs text-muted-foreground">
						{product.owners.length} owner{product.owners.length === 1 ? "" : "s"}
					</p>
				</CardContent>
			</Card>
		</Link>
	);
}

function ProductsGrid({ products }: Readonly<{ products: Product[] }>) {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{products.map((product) => (
				<ProductCard key={product._id} product={product} />
			))}
		</div>
	);
}

function ProductsContent({ products }: Readonly<{ products: Product[] | undefined }>) {
	if (products === undefined) {
		return <LoadingSkeleton />;
	}
	if (products.length === 0) {
		return <EmptyState />;
	}
	return <ProductsGrid products={products} />;
}

export default function ProductsPage() {
	const orgContext = useOrganization();
	const activeOrganization = orgContext?.activeOrganization;

	// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access
	const { api } = require("../../../../convex/_generated/api");
	const products = useQuery(
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		api.products?.list,
		activeOrganization ? { organizationId: activeOrganization.id } : "skip",
	) as Product[] | undefined;

	if (!activeOrganization) {
		return <NoOrganizationGuard action="manage products" />;
	}

	return (
		<div className="container mx-auto max-w-6xl space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Products</h1>
					<p className="text-muted-foreground">Manage your organization&apos;s products</p>
				</div>
				<Button asChild>
					<Link href="/products/new">
						<PlusIcon className="mr-2 h-4 w-4" />
						New Product
					</Link>
				</Button>
			</div>

			<ProductsContent products={products} />
		</div>
	);
}
