"use client";

import { useMutation } from "convex/react";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { Feature, FeatureStatus } from "@/components/products/types";
import { getDialogSubmitLabel } from "@/components/products/types";
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
import { Textarea } from "@/components/ui/textarea";

interface FeatureDialogProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly mode: "create" | "edit";
	readonly productId: string;
	readonly organizationId: string;
	readonly initialData?: Feature;
	readonly onSuccess?: () => void;
}

const FEATURE_STATUSES: { value: FeatureStatus; label: string }[] = [
	{ value: "draft", label: "Draft" },
	{ value: "ready", label: "Ready" },
	{ value: "in_progress", label: "In Progress" },
	{ value: "completed", label: "Completed" },
];

export function FeatureDialog({
	open,
	onOpenChange,
	mode,
	productId,
	organizationId,
	initialData,
	onSuccess,
}: FeatureDialogProps) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [status, setStatus] = useState<FeatureStatus>("draft");
	const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access
	const { api } = require("../../../convex/_generated/api");
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	const createFeature = useMutation(api.products?.createFeature);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	const updateFeature = useMutation(api.products?.updateFeature);

	useEffect(() => {
		if (!open) return;

		const isEditMode = mode === "edit" && initialData;
		setTitle(isEditMode ? initialData.title : "");
		setDescription(isEditMode ? (initialData.description ?? "") : "");
		setStatus(isEditMode ? initialData.status : "draft");
		setAcceptanceCriteria(isEditMode ? [...initialData.acceptanceCriteria] : []);
		setError(null);
	}, [open, mode, initialData]);

	const handleAddCriterion = () => {
		setAcceptanceCriteria([...acceptanceCriteria, ""]);
	};

	const handleUpdateCriterion = (index: number, value: string) => {
		const updated = [...acceptanceCriteria];
		updated[index] = value;
		setAcceptanceCriteria(updated);
	};

	const handleRemoveCriterion = (index: number) => {
		setAcceptanceCriteria(acceptanceCriteria.filter((_, i) => i !== index));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		const cleanedCriteria = acceptanceCriteria.map((c) => c.trim()).filter(Boolean);

		try {
			if (mode === "create") {
				await createFeature({
					productId,
					organizationId,
					title: title.trim(),
					description: description.trim() || null,
					status,
					acceptanceCriteria: cleanedCriteria,
				});
			} else if (initialData) {
				await updateFeature({
					featureId: initialData._id,
					organizationId,
					title: title.trim(),
					description: description.trim() || null,
					status,
					acceptanceCriteria: cleanedCriteria,
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

	const dialogTitle = mode === "create" ? "Add Feature" : "Edit Feature";
	const dialogDescription =
		mode === "create"
			? "Add a new feature or outcome request to track"
			: "Update the feature details";
	const submitLabel = getDialogSubmitLabel(mode, isSubmitting, "Feature");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>{dialogTitle}</DialogTitle>
						<DialogDescription>{dialogDescription}</DialogDescription>
					</DialogHeader>

					<div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-2">
						<div className="space-y-2">
							<Label htmlFor="feature-title">Title</Label>
							<Input
								id="feature-title"
								type="text"
								placeholder="e.g., User Authentication Flow"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								required
								disabled={isSubmitting}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="feature-description">Description</Label>
							<Textarea
								id="feature-description"
								placeholder="Describe the feature requirements..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								disabled={isSubmitting}
								rows={3}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="feature-status">Status</Label>
							<Select
								value={status}
								onValueChange={(value) => setStatus(value as FeatureStatus)}
								disabled={isSubmitting}
							>
								<SelectTrigger id="feature-status">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									{FEATURE_STATUSES.map((s) => (
										<SelectItem key={s.value} value={s.value}>
											{s.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label>Acceptance Criteria</Label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleAddCriterion}
									disabled={isSubmitting}
								>
									<PlusIcon className="mr-1 h-3 w-3" />
									Add
								</Button>
							</div>
							{acceptanceCriteria.length === 0 ? (
								<p className="text-xs text-muted-foreground">
									No acceptance criteria defined. Click &quot;Add&quot; to add criteria.
								</p>
							) : (
								<div className="space-y-2">
									{acceptanceCriteria.map((criterion, index) => (
										<div key={`criterion-${index.toString()}`} className="flex items-start gap-2">
											<Input
												type="text"
												placeholder={`Criterion ${index + 1}`}
												value={criterion}
												onChange={(e) => handleUpdateCriterion(index, e.target.value)}
												disabled={isSubmitting}
												className="flex-1"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => handleRemoveCriterion(index)}
												disabled={isSubmitting}
											>
												<TrashIcon className="h-4 w-4 text-muted-foreground" />
											</Button>
										</div>
									))}
								</div>
							)}
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
						<Button type="submit" disabled={isSubmitting || !title.trim()}>
							{submitLabel}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
