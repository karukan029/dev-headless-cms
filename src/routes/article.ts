import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import type { Bindings } from "../middlewares/authMiddleware";
import {
	apiKeyAuthMiddleware,
	requireReadMiddleware,
} from "../middlewares/authMiddleware";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", apiKeyAuthMiddleware, requireReadMiddleware);

const contentParamSchema = v.object({
	id: v.string(),
});

const contentResponseSchema = v.object({
	title: v.string(),
	content: v.string(),
});

app.get(
	"/detail/:id",
	describeRoute({
		description: "Get content details",
		responses: {
			200: {
				description: "Successful response with content details",
				content: {
					"application/json": {
						schema: resolver(contentResponseSchema),
					},
				},
			},
			500: {
				description: "Failed to get content details",
				content: {
					"application/json": {
						schema: resolver(v.object({ error: v.string() })),
					},
				},
			},
		},
	}),
	validator("param", contentParamSchema),
	async (c) => {
		const { id } = c.req.param();

		// ダミーのコンテンツデータ
		const mockContent = {
			title: `Sample Content ${id}`,
			content: `This is the content body for content ID ${id}.`,
		};

		return c.json(mockContent);
	},
);

export default app;
