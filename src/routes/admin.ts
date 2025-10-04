import { Hono } from "hono";
import {
	apiKeyAuthMiddleware,
	auditLogMiddleware,
	jwtAuthMiddleware,
	requireAdminMiddleware,
	type Variables,
} from "../middlewares/authMiddleware";

// Protected Admin API Routes
const app = new Hono<{ Variables: Variables }>();

app.use(
	"*",
	apiKeyAuthMiddleware,
	jwtAuthMiddleware,
	requireAdminMiddleware,
	auditLogMiddleware,
);

// ユーザー一覧取得
app.get("/users", async (c) => {
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
