import { createApi } from "@convex-dev/better-auth";
import { createAuthOptions } from "../lib/auth_options";
import schema from "./schema";

export const { create, findOne, findMany, updateOne, updateMany, deleteOne, deleteMany } =
	createApi(schema, createAuthOptions);
