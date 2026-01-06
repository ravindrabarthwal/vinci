"use client";

import { ProductForm } from "@/components/products/product-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewProductPage() {
	return (
		<div className="container mx-auto max-w-2xl p-6">
			<Card>
				<CardHeader>
					<CardTitle>Create Product</CardTitle>
					<CardDescription>Add a new product to your organization</CardDescription>
				</CardHeader>
				<CardContent>
					<ProductForm mode="create" />
				</CardContent>
			</Card>
		</div>
	);
}
