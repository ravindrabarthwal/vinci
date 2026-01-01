import fs from "node:fs";
import path from "node:path";
import pino from "pino";

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

function getLogFilePath(logDir: string): string {
	return path.join(logDir, `next-${getDateString()}.jsonl`);
}

export function createNodeLogger(config: LoggerNodeConfig): pino.Logger {
	if (config.silent) {
		return pino({ level: "silent" });
	}

	const logDir = path.resolve(process.cwd(), config.logDir);

	if (!fs.existsSync(logDir)) {
		fs.mkdirSync(logDir, { recursive: true });
	}

	const logFilePath = getLogFilePath(logDir);

	const destination = pino.destination({
		dest: logFilePath,
		sync: true,
	});

	return pino(
		{
			level: config.level,
			timestamp: pino.stdTimeFunctions.isoTime,
			formatters: {
				level: (label) => ({ level: label }),
			},
			base: { service: SERVICE_NAME },
		},
		destination,
	);
}

let cachedLogger: pino.Logger | null = null;
let cachedLogDate: string | null = null;

export function getNodeLogger(config: LoggerNodeConfig): pino.Logger {
	const currentDate = getDateString();

	if (!cachedLogger || cachedLogDate !== currentDate) {
		cachedLogger = createNodeLogger(config);
		cachedLogDate = currentDate;
	}

	return cachedLogger;
}

export function resetNodeLogger(): void {
	cachedLogger = null;
	cachedLogDate = null;
}
