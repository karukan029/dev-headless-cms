import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import type { Bindings } from "../../middlewares/authMiddleware";
import {
	apiKeyAuthMiddleware,
	requireAdminMiddleware,
} from "../../middlewares/authMiddleware";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", apiKeyAuthMiddleware, requireAdminMiddleware);

const createArticleSchema = v.object({
	title: v.string(),
	content: v.string(),
	isPublished: v.boolean(),
	icon: v.optional(v.string()),
	type: v.optional(v.string()),
	topics: v.optional(v.string()),
});

app.post(
	"/create",
	describeRoute({
		description: "Create new article",
		responses: {
			200: {
				description: "Successful response with created article ID",
				content: {
					"application/json": {
						schema: resolver(
							v.object({
								id: v.string(),
								message: v.string(),
							}),
						),
					},
				},
			},
			400: {
				description: "Invalid request payload",
				content: {
					"application/json": {
						schema: resolver(v.object({ error: v.string() })),
					},
				},
			},
			500: {
				description: "Failed to create article",
				content: {
					"application/json": {
						schema: resolver(v.object({ error: v.string() })),
					},
				},
			},
		},
	}),
	validator("json", createArticleSchema),
	async (c) => {
		const { title, content } = c.req.valid("json");

		// ダミーのコンテンツ作成ロジック
		const newContentId =
			"content_" + Math.random().toString(36).substring(2, 15);

		return c.json({
			id: newContentId,
			message: "Content created successfully",
		});
	},
);

export default app;
