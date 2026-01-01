import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { createNodeLogger, resetNodeLogger } from "@/lib/logging/logger-node";

const TEST_LOG_DIR = path.join(process.cwd(), ".logs-test");

function getDateString(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

describe("Logging - Integration Tests", () => {
	beforeAll(() => {
		if (fs.existsSync(TEST_LOG_DIR)) {
			fs.rmSync(TEST_LOG_DIR, { recursive: true });
		}
		fs.mkdirSync(TEST_LOG_DIR, { recursive: true });
	});

	afterAll(() => {
		resetNodeLogger();
		if (fs.existsSync(TEST_LOG_DIR)) {
			fs.rmSync(TEST_LOG_DIR, { recursive: true });
		}
	});

	it("#given Pino logger configured #when logging message #then writes to daily file", async () => {
		// #given - create a logger with test config
		const logger = createNodeLogger({
			level: "info",
			logDir: TEST_LOG_DIR,
			silent: false,
		});

		const testMessage = "Integration test log message";
		const testTraceId = "test-trace-123";

		// #when - log a message with context
		logger.info({ traceId: testTraceId }, testMessage);

		logger.flush();
		await new Promise((resolve) => setTimeout(resolve, 100));

		// #then - file should exist with correct name format
		const expectedFileName = `next-${getDateString()}.jsonl`;
		const logFilePath = path.join(TEST_LOG_DIR, expectedFileName);

		expect(fs.existsSync(logFilePath)).toBe(true);

		// #then - file should contain valid JSONL
		const fileContent = fs.readFileSync(logFilePath, "utf-8").trim();
		const lines = fileContent.split("\n");

		expect(lines.length).toBeGreaterThan(0);

		const lastLine = lines[lines.length - 1];
		if (!lastLine) {
			throw new Error("No log lines found");
		}
		const logEntry = JSON.parse(lastLine);
		expect(logEntry.msg).toBe(testMessage);
		expect(logEntry.traceId).toBe(testTraceId);
		expect(logEntry.level).toBe("info");
		expect(logEntry.service).toBe("vinci-next");
	});

	it("#given Pino logger #when logging multiple levels #then all captured correctly", async () => {
		// #given - fresh logger
		resetNodeLogger();
		const logger = createNodeLogger({
			level: "debug",
			logDir: TEST_LOG_DIR,
			silent: false,
		});

		// #when - log at multiple levels
		logger.debug("Debug message");
		logger.info("Info message");
		logger.warn("Warning message");
		logger.error("Error message");

		logger.flush();
		await new Promise((resolve) => setTimeout(resolve, 100));

		// #then - all messages should be in file
		const expectedFileName = `next-${getDateString()}.jsonl`;
		const logFilePath = path.join(TEST_LOG_DIR, expectedFileName);
		const fileContent = fs.readFileSync(logFilePath, "utf-8").trim();
		const lines = fileContent.split("\n");

		const levels = lines.map((line) => JSON.parse(line).level);
		expect(levels).toContain("debug");
		expect(levels).toContain("info");
		expect(levels).toContain("warn");
		expect(levels).toContain("error");
	});

	it("#given silent mode enabled #when logging #then no file created", () => {
		// #given - logger in silent mode with unique test dir
		const silentTestDir = path.join(TEST_LOG_DIR, "silent-test");
		if (fs.existsSync(silentTestDir)) {
			fs.rmSync(silentTestDir, { recursive: true });
		}

		const silentLogger = createNodeLogger({
			level: "info",
			logDir: silentTestDir,
			silent: true,
		});

		// #when - attempt to log
		silentLogger.info("This should not be written");

		// #then - directory should not be created (silent mode doesn't write)
		expect(fs.existsSync(silentTestDir)).toBe(false);
	});

	it("#given log directory doesn't exist #when logger created #then directory created automatically", () => {
		// #given - non-existent directory
		const newTestDir = path.join(TEST_LOG_DIR, "auto-created-dir");
		if (fs.existsSync(newTestDir)) {
			fs.rmSync(newTestDir, { recursive: true });
		}

		// #when - create logger targeting non-existent dir
		createNodeLogger({
			level: "info",
			logDir: newTestDir,
			silent: false,
		});

		// #then - directory should be created
		expect(fs.existsSync(newTestDir)).toBe(true);
	});

	it("#given JSONL format #when parsed #then each line is valid JSON with required fields", async () => {
		// #given - logger with specific config
		resetNodeLogger();
		const logger = createNodeLogger({
			level: "info",
			logDir: TEST_LOG_DIR,
			silent: false,
		});

		// #when - log message
		logger.info({ requestId: "req-456" }, "Request processed");
		logger.flush();
		await new Promise((resolve) => setTimeout(resolve, 100));

		// #then - parse and validate structure
		const expectedFileName = `next-${getDateString()}.jsonl`;
		const logFilePath = path.join(TEST_LOG_DIR, expectedFileName);
		const fileContent = fs.readFileSync(logFilePath, "utf-8").trim();
		const lines = fileContent.split("\n");

		for (const line of lines) {
			const entry = JSON.parse(line);

			expect(entry).toHaveProperty("level");
			expect(entry).toHaveProperty("time");
			expect(entry).toHaveProperty("service");
			expect(entry).toHaveProperty("msg");

			expect(new Date(entry.time).toISOString()).toBe(entry.time);
		}
	});

	it("#given sync destination #when log written #then immediately available on disk", () => {
		// #given - fresh logger with sync destination
		resetNodeLogger();
		const syncTestDir = path.join(TEST_LOG_DIR, "sync-test");
		if (fs.existsSync(syncTestDir)) {
			fs.rmSync(syncTestDir, { recursive: true });
		}

		const logger = createNodeLogger({
			level: "info",
			logDir: syncTestDir,
			silent: false,
		});

		const uniqueMessage = `Sync test ${Date.now()}`;

		// #when - log without explicit flush (sync mode writes immediately)
		logger.info({ marker: "sync-verify" }, uniqueMessage);

		// #then - should be on disk immediately (no setTimeout needed)
		const expectedFileName = `next-${getDateString()}.jsonl`;
		const logFilePath = path.join(syncTestDir, expectedFileName);

		expect(fs.existsSync(logFilePath)).toBe(true);
		const content = fs.readFileSync(logFilePath, "utf-8");
		expect(content).toContain(uniqueMessage);
		expect(content).toContain("sync-verify");
	});
});
