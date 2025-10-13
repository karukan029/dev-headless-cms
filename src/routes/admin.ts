import { Hono } from "hono";
import {
	apiKeyAuthMiddleware,
	auditLogMiddleware,
	jwtAuthMiddleware,
	requireAdminMiddleware,
	type Variables,
} from "../middlewares/authMiddleware";
import * as v from "valibot";
import { describeRoute, resolver } from 'hono-openapi';

// Protected Admin API Routes
const app = new Hono<{ Variables: Variables }>();

app.use(
	"*",
	apiKeyAuthMiddleware,
	jwtAuthMiddleware,
	requireAdminMiddleware,
	auditLogMiddleware,
);

const userSchema = v.object({
	id: v.number(),
	name: v.string(),
	email: v.string(),
});

const usersResponseSchema = v.object({
	users: v.array(userSchema),
	client: v.string(),
	timestamp: v.string(),
});

// ユーザー一覧取得
app.get("/users", describeRoute({
	description: 'Get list of all users (admin only)',
	responses: {
		200: {
			description: 'Successful response with list of users',
			content: {
				'application/json': {
					schema: resolver(usersResponseSchema),
				},
			},
		},
	},
}), async (c) => {
	const user = c.get("user");

	// 実際のユーザー情報取得ロジック
	const mockUsers = [
		{ id: 1, name: "John Doe", email: "john@example.com" },
		{ id: 2, name: "Jane Smith", email: "jane@example.com" },
	];

	return c.json({
		users: mockUsers,
		client: user.client,
		timestamp: new Date().toISOString(),
	});
});

export default app;
