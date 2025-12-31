#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "bun";

const LOG_MARKER = "__VINCI_LOG__";
const LOG_DIR = process.env.LOG_DIR ?? ".logs";

function getDateString(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getLogFilePath(): string {
	return path.join(LOG_DIR, `convex-${getDateString()}.jsonl`);
}

async function ensureLogDir(): Promise<void> {
	if (!existsSync(LOG_DIR)) {
		await mkdir(LOG_DIR, { recursive: true });
	}
}

type CleanLogEntry = {
	level: string;
	msg: string;
	time: number;
	service: string;
	traceId?: string;
	[key: string]: unknown;
};

const ALLOWED_FILE_LEVELS = new Set(["warn", "error", "fatal"]);

async function processLine(line: string, stream: "stdout" | "stderr"): Promise<void> {
	if (line.includes(LOG_MARKER)) {
		const jsonMatch = line.match(/\{[^{}]*"marker"\s*:\s*"__VINCI_LOG__"[^{}]*\}/);
		if (jsonMatch) {
			try {
				const logEntry = JSON.parse(jsonMatch[0]) as CleanLogEntry & { marker: string };
				const { marker: _marker, ...cleanEntry } = logEntry;

				// Only write warn/error/fatal to file
				if (ALLOWED_FILE_LEVELS.has(cleanEntry.level)) {
					await appendFile(getLogFilePath(), `${JSON.stringify(cleanEntry)}\n`);
				}

				const levelColors: Record<string, string> = {
					trace: "\x1b[90m",
					debug: "\x1b[36m",
					info: "\x1b[32m",
					warn: "\x1b[33m",
					error: "\x1b[31m",
					fatal: "\x1b[35m",
				};
				const reset = "\x1b[0m";
				const color = levelColors[cleanEntry.level] ?? "";
				const traceStr = cleanEntry.traceId ? ` [${String(cleanEntry.traceId).slice(0, 8)}]` : "";
				console.log(
					`${color}[CONVEX:${cleanEntry.level.toUpperCase()}]${traceStr} ${cleanEntry.msg}${reset}`,
				);
				return;
			} catch {
				// Fall through to passthrough
			}
		}
	}

	if (stream === "stderr") {
		console.error(line);
	} else {
		console.log(line);
	}
}

async function processStream(
	stream: ReadableStream<Uint8Array>,
	streamName: "stdout" | "stderr",
): Promise<void> {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() ?? "";

			for (const line of lines) {
				if (line.trim()) {
					await processLine(line, streamName);
				}
			}
		}

		if (buffer.trim()) {
			await processLine(buffer, streamName);
		}
	} finally {
		reader.releaseLock();
	}
}

async function main(): Promise<void> {
	await ensureLogDir();

	console.log("\x1b[36m[convex-log-router] Starting Convex dev server...\x1b[0m");
	console.log(`\x1b[36m[convex-log-router] Logs will be written to: ${getLogFilePath()}\x1b[0m`);

	const proc = spawn(["bunx", "convex", "dev"], {
		stdout: "pipe",
		stderr: "pipe",
		env: {
			...process.env,
			FORCE_COLOR: "1",
		},
	});

	process.on("SIGINT", () => {
		console.log("\n\x1b[36m[convex-log-router] Shutting down...\x1b[0m");
		proc.kill();
		process.exit(0);
	});

	process.on("SIGTERM", () => {
		proc.kill();
		process.exit(0);
	});

	await Promise.all([processStream(proc.stdout, "stdout"), processStream(proc.stderr, "stderr")]);

	const exitCode = await proc.exited;
	process.exit(exitCode);
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
