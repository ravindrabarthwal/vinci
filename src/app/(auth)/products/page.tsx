"use client";

import { useQuery } from "convex/react";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useOrganization } from "@/components/providers/organization-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Criticality = "low" | "medium" | "high";

interface Product {
	_id: string;
	name: string;
	description?: string | null;
	criticality: Criticality;
	owners: string[];
}

const criticalityColors: Record<Criticality, string> = {
	low: "bg-green-100 text-green-800",
	medium: "bg-yellow-100 text-yellow-800",
	high: "bg-red-100 text-red-800",
};

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

			{products === undefined ? (
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
			) : products.length === 0 ? (
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
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{products.map((product) => (
						<Link key={product._id} href={`/products/${product._id}`}>
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
										<CardDescription className="line-clamp-2">
											{product.description}
										</CardDescription>
									)}
								</CardHeader>
								<CardContent>
									<p className="text-xs text-muted-foreground">
										{product.owners.length} owner{product.owners.length !== 1 ? "s" : ""}
									</p>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
