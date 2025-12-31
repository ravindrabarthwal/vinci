import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { createConvexLogger } from "./lib/log";

const logger = createConvexLogger({ module: "http" });

const http = httpRouter();

logger.info("Registering auth routes");
authComponent.registerRoutes(http, createAuth);

export default http;
