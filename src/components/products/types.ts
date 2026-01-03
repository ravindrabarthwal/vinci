export type Criticality = "low" | "medium" | "high";
export type SurfaceType = "repo" | "service" | "webapp" | "worker" | "infra";
export type FeatureStatus = "draft" | "ready" | "in_progress" | "completed";
export type FeatureSource = "manual" | "jira";

export interface Product {
	_id: string;
	name: string;
	description?: string | null;
	criticality: Criticality;
	owners: string[];
}

export interface Surface {
	_id: string;
	name: string;
	type: SurfaceType;
	location?: string | null;
	environments: Record<string, string>;
}

export interface Feature {
	_id: string;
	title: string;
	description?: string | null;
	status: FeatureStatus;
	source: FeatureSource;
	acceptanceCriteria: string[];
}

export interface ProductWithRelations extends Product {
	surfaces: Surface[];
	features: Feature[];
}

export const criticalityColors: Readonly<Record<Criticality, string>> = {
	low: "bg-green-100 text-green-800",
	medium: "bg-yellow-100 text-yellow-800",
	high: "bg-red-100 text-red-800",
};

export const surfaceTypeLabels: Readonly<Record<SurfaceType, string>> = {
	repo: "Repository",
	service: "Service",
	webapp: "Web App",
	worker: "Worker",
	infra: "Infrastructure",
};

export const statusColors: Readonly<Record<FeatureStatus, string>> = {
	draft: "bg-gray-100 text-gray-800",
	ready: "bg-blue-100 text-blue-800",
	in_progress: "bg-purple-100 text-purple-800",
	completed: "bg-green-100 text-green-800",
};
