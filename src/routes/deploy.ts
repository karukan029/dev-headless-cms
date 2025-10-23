import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import type { Bindings } from "../middlewares/authMiddleware";
import { apiKeyAuthMiddleware } from "../middlewares/authMiddleware";
import * as v from "valibot";

const app = new Hono<{ Bindings: Bindings }>();

const deployParamSchema = v.object({
	owner: v.string(),
	repo: v.string(),
	event_type: v.string(),
});

const deployResponseSchema = v.object({
	message: v.string(),
	status: v.string(),
});

app.post(
	"/deploy",
	apiKeyAuthMiddleware,
	describeRoute({
		description: "Deploy the latest version of the application",
		responses: {
			200: {
				description: "Successful response with deployment status",
				content: {
					"application/json": {
						schema: resolver(deployResponseSchema),
					},
				},
			},
			500: {
				description: "Failed to trigger deployment",
				content: {
					"application/json": {
						schema: resolver(v.object({ error: v.string() })),
					},
				},
			},
		},
	}),
	validator("json", deployParamSchema),
	async (c) => {
		const { owner, repo, event_type } = c.req.valid("json");

		const githubToken = c.env.GITHUB_TOKEN;

		if (!githubToken) {
			return c.json({ error: "GitHub token not configured" }, 500);
		}

		try {
			const response = await fetch(
				`https://api.github.com/repos/${owner}/${repo}/dispatches`,
				{
					method: "POST",
					headers: {
						Accept: "application/vnd.github+json",
						Authorization: `Bearer ${githubToken}`,
						"X-GitHub-Api-Version": "2022-11-28",
						"Content-Type": "application/json",
						"User-Agent": "dev-headless-cms",
					},
					body: JSON.stringify({
						event_type,
					}),
				},
			);

			if (!response.ok) {
				const errorText = await response.text();
				return c.json({ error: `GitHub API error: ${errorText}` }, 500);
			}

			return c.json({
				status: "success",
			});
		} catch (error) {
			return c.json(
				{
					error: `Failed to trigger deployment: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
				500,
			);
		}
	},
);

export default app;
