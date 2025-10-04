import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Bindings, Variables } from "./middlewares/authMiddleware";
import adminApp from "./routes/admin";
import authApp from "./routes/auth";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath(
	"/api",
);

// ミドルウェア設定
app.use("*", logger());
app.use(
	"/api/*",
	cors({
		origin: ["http://localhost:3000"],
		allowMethods: ["GET", "POST", "PUT", "DELETE"],
		allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
	}),
);

// ヘルスチェック
app.get("/health", (c) => {
	return c.json({
		status: "OK",
		timestamp: new Date().toISOString(),
		version: "1.0.0",
	});
});

// TODO: Rate Limiting

app.route("/auth", authApp).route("/admin", adminApp);

export default app;
