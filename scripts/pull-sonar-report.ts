#!/usr/bin/env bun
/**
 * SonarCloud Report Fetcher
 *
 * Fetches SonarCloud analysis reports for AI agent consumption.
 * Supports fetching reports for the entire project or specific PRs/branches.
 *
 * Usage:
 *   bun run scripts/pull-sonar-report.ts [options]
 *
 * Options:
 *   --pr <number>       Fetch analysis for a specific PR
 *   --branch <name>     Fetch analysis for a specific branch
 *   --format <type>     Output format: 'summary' (default), 'detailed', 'json'
 *
 * Environment Variables:
 *   SONAR_TOKEN         SonarCloud API token (required)
 *   SONAR_PROJECT_KEY   Project key (optional, defaults to sonar-project.properties)
 *   SONAR_ORGANIZATION  Organization key (optional, defaults to sonar-project.properties)
 *
 * For AI agents:
 *   This script outputs structured analysis data including:
 *   - Quality gate status (PASSED/FAILED)
 *   - Code metrics (bugs, vulnerabilities, code smells, coverage)
 *   - Issues list with severity, location, and suggested fixes
 */

const SONAR_BASE_URL = "https://sonarcloud.io";

interface SonarConfig {
	token: string;
	projectKey: string;
	organization: string;
}

interface QualityGateCondition {
	status: "OK" | "ERROR" | "WARN";
	metricKey: string;
	comparator: string;
	errorThreshold?: string;
	actualValue: string;
}

interface QualityGateStatus {
	projectStatus: {
		status: "OK" | "ERROR" | "WARN" | "NONE";
		conditions: QualityGateCondition[];
		ignoredConditions: boolean;
	};
}

interface Measure {
	metric: string;
	value: string;
	bestValue?: boolean;
}

interface MeasuresResponse {
	component: {
		id: string;
		key: string;
		name: string;
		qualifier: string;
		measures: Measure[];
	};
}

interface Issue {
	key: string;
	rule: string;
	severity: "BLOCKER" | "CRITICAL" | "MAJOR" | "MINOR" | "INFO";
	component: string;
	project: string;
	line?: number;
	message: string;
	status: string;
	type: "BUG" | "VULNERABILITY" | "CODE_SMELL";
	effort?: string;
	debt?: string;
	author?: string;
	tags: string[];
	creationDate: string;
}

interface IssuesResponse {
	total: number;
	p: number;
	ps: number;
	paging: {
		pageIndex: number;
		pageSize: number;
		total: number;
	};
	issues: Issue[];
}

interface CliOptions {
	pr?: string;
	branch?: string;
	format: "summary" | "detailed" | "json";
}

interface SonarReport {
	fetchedAt: string;
	project: {
		key: string;
		organization: string;
	};
	target: {
		type: "project" | "pr" | "branch";
		value?: string;
	};
	qualityGate: {
		status: string;
		conditions: Array<{
			metric: string;
			status: string;
			threshold?: string;
			actual: string;
		}>;
	};
	metrics: Record<string, string>;
	issues: {
		total: number;
		byType: Record<string, number>;
		bySeverity: Record<string, number>;
		items: Array<{
			severity: string;
			type: string;
			message: string;
			file: string;
			line?: number;
			rule: string;
		}>;
	};
}

function loadSonarPropertiesSync(): { projectKey?: string; organization?: string } {
	try {
		const content = require("fs").readFileSync("sonar-project.properties", "utf-8");
		const props: Record<string, string> = {};

		for (const line of content.split("\n")) {
			const trimmed = line.trim();
			if (trimmed && !trimmed.startsWith("#")) {
				const [key, ...valueParts] = trimmed.split("=");
				if (key) {
					props[key.trim()] = valueParts.join("=").trim();
				}
			}
		}

		return {
			projectKey: props["sonar.projectKey"],
			organization: props["sonar.organization"],
		};
	} catch {
		return {};
	}
}

function getConfig(): SonarConfig {
	const token = process.env.SONAR_TOKEN;
	if (!token) {
		console.error("Error: SONAR_TOKEN environment variable is required");
		console.error("Generate a token at: https://sonarcloud.io/account/security");
		process.exit(1);
	}

	const sonarProps = loadSonarPropertiesSync();

	const projectKey = process.env.SONAR_PROJECT_KEY ?? sonarProps.projectKey;
	if (!projectKey) {
		console.error("Error: Project key not found");
		console.error("Set SONAR_PROJECT_KEY env var or ensure sonar-project.properties exists");
		process.exit(1);
	}

	const organization = process.env.SONAR_ORGANIZATION ?? sonarProps.organization;
	if (!organization) {
		console.error("Error: Organization not found");
		console.error("Set SONAR_ORGANIZATION env var or ensure sonar-project.properties exists");
		process.exit(1);
	}

	return { token, projectKey, organization };
}

async function sonarFetch<T>(
	config: SonarConfig,
	endpoint: string,
	params: Record<string, string | undefined> = {},
): Promise<T> {
	const url = new URL(`${SONAR_BASE_URL}${endpoint}`);

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) {
			url.searchParams.set(key, value);
		}
	}

	const response = await fetch(url.toString(), {
		headers: {
			Authorization: `Bearer ${config.token}`,
			Accept: "application/json",
		},
	});

	if (response.status === 429) {
		console.error("Error: Rate limited by SonarCloud. Please wait a few minutes and try again.");
		process.exit(1);
	}

	if (response.status === 401) {
		console.error(
			"Error: Invalid SONAR_TOKEN. Check your token at https://sonarcloud.io/account/security",
		);
		process.exit(1);
	}

	if (response.status === 404) {
		console.error(`Error: Resource not found. Check project key: ${config.projectKey}`);
		process.exit(1);
	}

	if (!response.ok) {
		const text = await response.text();
		console.error(`Error: SonarCloud API returned ${response.status}: ${text}`);
		process.exit(1);
	}

	return response.json() as Promise<T>;
}

async function fetchQualityGate(
	config: SonarConfig,
	options: { pr?: string; branch?: string },
): Promise<QualityGateStatus> {
	return sonarFetch<QualityGateStatus>(config, "/api/qualitygates/project_status", {
		projectKey: config.projectKey,
		pullRequest: options.pr,
		branch: options.branch,
	});
}

async function fetchMetrics(
	config: SonarConfig,
	options: { pr?: string; branch?: string },
): Promise<MeasuresResponse> {
	const metricKeys = [
		"ncloc",
		"bugs",
		"vulnerabilities",
		"code_smells",
		"coverage",
		"duplicated_lines_density",
		"sqale_rating",
		"reliability_rating",
		"security_rating",
		"security_hotspots",
		"new_bugs",
		"new_vulnerabilities",
		"new_code_smells",
		"new_coverage",
		"new_duplicated_lines_density",
	].join(",");

	return sonarFetch<MeasuresResponse>(config, "/api/measures/component", {
		component: config.projectKey,
		metricKeys,
		pullRequest: options.pr,
		branch: options.branch,
	});
}

async function fetchIssues(
	config: SonarConfig,
	options: { pr?: string; branch?: string },
): Promise<IssuesResponse> {
	return sonarFetch<IssuesResponse>(config, "/api/issues/search", {
		componentKeys: config.projectKey,
		statuses: "OPEN,CONFIRMED,REOPENED",
		ps: "100",
		pullRequest: options.pr,
		branch: options.branch,
	});
}

function buildReport(
	config: SonarConfig,
	qualityGate: QualityGateStatus,
	metrics: MeasuresResponse,
	issues: IssuesResponse,
	options: { pr?: string; branch?: string },
): SonarReport {
	const metricsMap: Record<string, string> = {};
	for (const m of metrics.component.measures) {
		metricsMap[m.metric] = m.value;
	}

	const byType: Record<string, number> = {};
	const bySeverity: Record<string, number> = {};

	for (const issue of issues.issues) {
		byType[issue.type] = (byType[issue.type] ?? 0) + 1;
		bySeverity[issue.severity] = (bySeverity[issue.severity] ?? 0) + 1;
	}

	return {
		fetchedAt: new Date().toISOString(),
		project: {
			key: config.projectKey,
			organization: config.organization,
		},
		target: {
			type: options.pr ? "pr" : options.branch ? "branch" : "project",
			value: options.pr ?? options.branch,
		},
		qualityGate: {
			status: qualityGate.projectStatus.status,
			conditions: qualityGate.projectStatus.conditions.map((c) => ({
				metric: c.metricKey,
				status: c.status,
				threshold: c.errorThreshold,
				actual: c.actualValue,
			})),
		},
		metrics: metricsMap,
		issues: {
			total: issues.total,
			byType,
			bySeverity,
			items: issues.issues.map((i) => ({
				severity: i.severity,
				type: i.type,
				message: i.message,
				file: i.component.replace(`${config.projectKey}:`, ""),
				line: i.line,
				rule: i.rule,
			})),
		},
	};
}

function formatSummary(report: SonarReport): string {
	const lines: string[] = [];
	const hr = "─".repeat(60);

	lines.push("");
	lines.push("╔══════════════════════════════════════════════════════════╗");
	lines.push("║              SONARCLOUD ANALYSIS REPORT                  ║");
	lines.push("╚══════════════════════════════════════════════════════════╝");
	lines.push("");

	const targetLabel =
		report.target.type === "pr"
			? `PR #${report.target.value}`
			: report.target.type === "branch"
				? `Branch: ${report.target.value}`
				: "Main Project";
	lines.push(`📍 Target: ${targetLabel}`);
	lines.push(`📦 Project: ${report.project.key}`);
	lines.push(`🕐 Fetched: ${report.fetchedAt}`);
	lines.push("");

	const gateIcon = report.qualityGate.status === "OK" ? "✅" : "❌";
	lines.push(`${hr}`);
	lines.push(`${gateIcon} QUALITY GATE: ${report.qualityGate.status}`);
	lines.push(`${hr}`);

	if (report.qualityGate.conditions.length > 0) {
		lines.push("");
		for (const cond of report.qualityGate.conditions) {
			const icon = cond.status === "OK" ? "  ✓" : "  ✗";
			const threshold = cond.threshold ? ` (threshold: ${cond.threshold})` : "";
			lines.push(`${icon} ${cond.metric}: ${cond.actual}${threshold}`);
		}
	}
	lines.push("");

	lines.push(`${hr}`);
	lines.push("📊 METRICS");
	lines.push(`${hr}`);
	lines.push("");

	const metricLabels: Record<string, string> = {
		ncloc: "Lines of Code",
		bugs: "Bugs",
		vulnerabilities: "Vulnerabilities",
		code_smells: "Code Smells",
		coverage: "Coverage",
		duplicated_lines_density: "Duplication",
		security_hotspots: "Security Hotspots",
		new_bugs: "New Bugs",
		new_vulnerabilities: "New Vulnerabilities",
		new_code_smells: "New Code Smells",
		new_coverage: "New Code Coverage",
	};

	for (const [key, label] of Object.entries(metricLabels)) {
		const value = report.metrics[key];
		if (value !== undefined) {
			const suffix = key.includes("coverage") || key.includes("density") ? "%" : "";
			lines.push(`  ${label}: ${value}${suffix}`);
		}
	}
	lines.push("");

	lines.push(`${hr}`);
	lines.push(`🐛 ISSUES (${report.issues.total} total)`);
	lines.push(`${hr}`);
	lines.push("");

	if (report.issues.total > 0) {
		lines.push("  By Type:");
		for (const [type, count] of Object.entries(report.issues.byType)) {
			lines.push(`    ${type}: ${count}`);
		}
		lines.push("");
		lines.push("  By Severity:");
		for (const [severity, count] of Object.entries(report.issues.bySeverity)) {
			lines.push(`    ${severity}: ${count}`);
		}
		lines.push("");
	} else {
		lines.push("  No open issues found! 🎉");
		lines.push("");
	}

	return lines.join("\n");
}

function formatDetailed(report: SonarReport): string {
	let output = formatSummary(report);
	const hr = "─".repeat(60);

	if (report.issues.items.length > 0) {
		output += `\n${hr}\n`;
		output += "📋 ISSUE DETAILS\n";
		output += `${hr}\n\n`;

		const severityOrder = ["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "INFO"];

		for (const severity of severityOrder) {
			const sevIssues = report.issues.items.filter((i) => i.severity === severity);
			if (sevIssues.length === 0) continue;

			output += `\n── ${severity} (${sevIssues.length}) ──\n\n`;

			for (const issue of sevIssues) {
				const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
				output += `  [${issue.type}] ${issue.message}\n`;
				output += `    📁 ${location}\n`;
				output += `    📏 Rule: ${issue.rule}\n`;
				output += "\n";
			}
		}
	}

	return output;
}

function formatJson(report: SonarReport): string {
	return JSON.stringify(report, null, 2);
}

function parseArgs(): CliOptions {
	const args = process.argv.slice(2);
	const options: CliOptions = {
		format: "summary",
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		const nextArg = args[i + 1];

		if (arg === "--pr" && nextArg) {
			options.pr = nextArg;
			i++;
		} else if (arg === "--branch" && nextArg) {
			options.branch = nextArg;
			i++;
		} else if (arg === "--format" && nextArg) {
			if (nextArg === "summary" || nextArg === "detailed" || nextArg === "json") {
				options.format = nextArg;
			} else {
				console.error(`Invalid format: ${nextArg}. Use 'summary', 'detailed', or 'json'`);
				process.exit(1);
			}
			i++;
		} else if (arg === "--help" || arg === "-h") {
			console.log(`
SonarCloud Report Fetcher

Usage:
  bun run scripts/pull-sonar-report.ts [options]

Options:
  --pr <number>       Fetch analysis for a specific PR
  --branch <name>     Fetch analysis for a specific branch  
  --format <type>     Output format: 'summary' (default), 'detailed', 'json'
  --help, -h          Show this help message

Environment Variables:
  SONAR_TOKEN         SonarCloud API token (required)
  SONAR_PROJECT_KEY   Project key (optional, reads from sonar-project.properties)
  SONAR_ORGANIZATION  Organization key (optional, reads from sonar-project.properties)

Examples:
  # Get summary for main project
  SONAR_TOKEN=xxx bun run scripts/pull-sonar-report.ts

  # Get detailed report for PR #42
  SONAR_TOKEN=xxx bun run scripts/pull-sonar-report.ts --pr 42 --format detailed

  # Get JSON output for feature branch
  SONAR_TOKEN=xxx bun run scripts/pull-sonar-report.ts --branch feature/auth --format json
`);
			process.exit(0);
		}
	}

	return options;
}

async function main(): Promise<void> {
	const options = parseArgs();
	const config = getConfig();

	console.error("Fetching SonarCloud analysis...");

	const [qualityGate, metrics, issues] = await Promise.all([
		fetchQualityGate(config, options),
		fetchMetrics(config, options),
		fetchIssues(config, options),
	]);

	const report = buildReport(config, qualityGate, metrics, issues, options);

	switch (options.format) {
		case "json":
			console.log(formatJson(report));
			break;
		case "detailed":
			console.log(formatDetailed(report));
			break;
		default:
			console.log(formatSummary(report));
	}
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
