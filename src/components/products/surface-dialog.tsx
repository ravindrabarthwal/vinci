"use client";

import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import type { Surface, SurfaceType } from "@/components/products/types";
import { getDialogSubmitLabel, surfaceTypeLabels } from "@/components/products/types";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface SurfaceDialogProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly mode: "create" | "edit";
	readonly productId: string;
	readonly organizationId: string;
	readonly initialData?: Surface;
	readonly onSuccess?: () => void;
}

const SURFACE_TYPES: SurfaceType[] = ["repo", "service", "webapp", "worker", "infra"];

export function SurfaceDialog({
	open,
	onOpenChange,
	mode,
	productId,
	organizationId,
	initialData,
	onSuccess,
}: SurfaceDialogProps) {
	const [name, setName] = useState("");
	const [type, setType] = useState<SurfaceType>("repo");
	const [location, setLocation] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const hasInitialized = useRef(false);

	// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access
	const { api } = require("../../../convex/_generated/api");
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	const createSurface = useMutation(api.products?.createSurface);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	const updateSurface = useMutation(api.products?.updateSurface);

	useEffect(() => {
		if (!open) {
			hasInitialized.current = false;
			return;
		}

		if (hasInitialized.current) return;

		const isEditMode = mode === "edit" && initialData;
		setName(isEditMode ? initialData.name : "");
		setType(isEditMode ? initialData.type : "repo");
		setLocation(isEditMode ? (initialData.location ?? "") : "");
		setError(null);
		hasInitialized.current = true;
	}, [open, mode, initialData]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			if (mode === "create") {
				await createSurface({
					productId,
					organizationId,
					name: name.trim(),
					type,
					location: location.trim() || null,
				});
			} else if (initialData) {
				await updateSurface({
					surfaceId: initialData._id,
					organizationId,
					name: name.trim(),
					type,
					location: location.trim() || null,
				});
			}
			onOpenChange(false);
			onSuccess?.();
		} catch (err) {
			setError(err instanceof Error ? err.message : "An unexpected error occurred");
		} finally {
			setIsSubmitting(false);
		}
	};

	const dialogTitle = mode === "create" ? "Add Surface" : "Edit Surface";
	const dialogDescription =
		mode === "create"
			? "Add a new deployable surface to this product"
			: "Update the surface details";
	const submitLabel = getDialogSubmitLabel(mode, isSubmitting, "Surface");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>{dialogTitle}</DialogTitle>
						<DialogDescription>{dialogDescription}</DialogDescription>
					</DialogHeader>

					<div className="mt-4 space-y-4">
						<div className="space-y-2">
							<Label htmlFor="surface-name">Name</Label>
							<Input
								id="surface-name"
								type="text"
								placeholder="e.g., api-service, frontend-app"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								disabled={isSubmitting}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="surface-type">Type</Label>
							<Select
								value={type}
								onValueChange={(value) => setType(value as SurfaceType)}
								disabled={isSubmitting}
							>
								<SelectTrigger id="surface-type">
									<SelectValue placeholder="Select type" />
								</SelectTrigger>
								<SelectContent>
									{SURFACE_TYPES.map((surfaceType) => (
										<SelectItem key={surfaceType} value={surfaceType}>
											{surfaceTypeLabels[surfaceType]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="surface-location">Location (URL)</Label>
							<Input
								id="surface-location"
								type="text"
								placeholder="e.g., https://github.com/org/repo"
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								disabled={isSubmitting}
							/>
							<p className="text-xs text-muted-foreground">
								Optional URL to the repository, service, or deployment
							</p>
						</div>

						{error && <p className="text-sm text-destructive">{error}</p>}
					</div>

					<DialogFooter className="mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting || !name.trim()}>
							{submitLabel}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
