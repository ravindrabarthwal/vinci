import fs from "node:fs";
import path from "node:path";
import pino from "pino";
import { createStream } from "rotating-file-stream";

const SERVICE_NAME = "vinci-next";

export type LoggerNodeConfig = {
	level: string;
	logDir: string;
	silent: boolean;
};

function getDateString(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function createLogFileName(baseName: string): string {
	return `${baseName}-${getDateString()}.jsonl`;
}

export function createNodeLogger(config: LoggerNodeConfig): pino.Logger {
	if (config.silent) {
		return pino({ level: "silent" });
	}

	const logDir = path.resolve(process.cwd(), config.logDir);

	if (!fs.existsSync(logDir)) {
		fs.mkdirSync(logDir, { recursive: true });
	}

	const rotatingStream = createStream(
		(time: Date | number) => {
			if (!time) {
				return createLogFileName("next");
			}
			const date = time instanceof Date ? time : new Date(time);
			const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
			return `next-${dateStr}.jsonl`;
		},
		{
			path: logDir,
			interval: "1d",
			compress: false,
		},
	);

	return pino(
		{
			level: config.level,
			timestamp: pino.stdTimeFunctions.isoTime,
			formatters: {
				level: (label) => ({ level: label }),
			},
			base: { service: SERVICE_NAME },
		},
		rotatingStream,
	);
}

let cachedLogger: pino.Logger | null = null;

export function getNodeLogger(config: LoggerNodeConfig): pino.Logger {
	if (!cachedLogger) {
		cachedLogger = createNodeLogger(config);
	}
	return cachedLogger;
}

export function resetNodeLogger(): void {
	cachedLogger = null;
}
