import { Hono } from "hono";
import { sign } from "hono/jwt";
import { describeRoute, resolver } from "hono-openapi";
import * as v from "valibot";
import {
	apiKeyAuthMiddleware,
	type Bindings,
	type JWTPayload,
	jwtAuthMiddleware,
} from "../middlewares/authMiddleware";

const app = new Hono<{ Bindings: Bindings }>();

const tokenResponseSchema = v.object({
	access_token: v.string(),
	token_type: v.literal("Bearer"),
	expires_in: v.number(),
	client_name: v.optional(v.string()),
});

// 認証エンドポイント - JWT Token取得
app.post(
	"/token",
	apiKeyAuthMiddleware,
	describeRoute({
		description: "Get a JWT token using an API key",
		responses: {
			200: {
				description: "Successful response with JWT token",
				content: {
					"application/json": {
						schema: resolver(tokenResponseSchema),
					},
				},
			},
		},
	}),
	async (c) => {
		const client = c.get("client");
		const jwtSecret = c.env.JWT_SECRET;

		if (!jwtSecret) {
			return c.json({ error: "JWT secret is not configured" }, 500);
		}

		const payload: JWTPayload = {
			client: client.name,
			permissions: client.permissions,
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2, // 2時間有効
		};

		const token = await sign(payload, jwtSecret);

		return c.json({
			access_token: token,
			token_type: "Bearer",
			expires_in: 7200,
			client_name: client.name,
		});
	},
);

// Token更新エンドポイント
app.post(
	"/refresh",
	jwtAuthMiddleware,
	describeRoute({
		description: "Refresh JWT token using existing valid token",
		responses: {
			200: {
				description: "Successful response with new JWT token",
				content: {
					"application/json": {
						schema: resolver(tokenResponseSchema),
					},
				},
			},
		},
	}),
	async (c) => {
		const user = c.get("user");
		const jwtSecret = c.env.JWT_SECRET;

		const newPayload: JWTPayload = {
			...user,
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2,
		};

		const newToken = await sign(newPayload, jwtSecret);

		return c.json({
			access_token: newToken,
			token_type: "Bearer",
			expires_in: 7200,
		});
	},
);

export default app;
