import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { createConvexLogger } from "./lib/log";

const logger = createConvexLogger({ module: "http" });

const http = httpRouter();

http.route({
	path: "/health",
	method: "GET",
	handler: httpAction(async () => {
		return new Response(JSON.stringify({ status: "ok" }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}),
});

logger.info("Registering auth routes");
authComponent.registerRoutes(http, createAuth);

export default http;
