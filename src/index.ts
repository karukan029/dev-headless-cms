import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { openAPIRouteHandler } from "hono-openapi";
import type { Bindings, Variables } from "./middlewares/authMiddleware";
import adminApp from "./routes/admin";
import adminArticleApp from "./routes/admin/article";
import articleApp from "./routes/article";
import authApp from "./routes/auth";
import deployApp from "./routes/deploy";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath(
	"/api",
);

// ミドルウェア設定
app.use("*", logger());
app.use("/api/*", async (c, next) => {
	cors({
		origin: ["*"],
		allowMethods: ["GET", "POST", "PUT", "DELETE"],
		allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
	});

	await next();
});

// ヘルスチェック
app.get("/health", (c) => {
	return c.json({
		status: "OK",
		timestamp: new Date().toISOString(),
		version: "1.0.0",
	});
});

// TODO: Rate Limiting

app
	.route("/auth", authApp)
	.route("/admin", adminApp)
	.route("/admin/article", adminArticleApp)
	.route("/deploy", deployApp)
	.route("/article", articleApp);

app.get(
	"/openapi",
	openAPIRouteHandler(app, {
		documentation: {
			info: {
				title: "Hono API",
				version: "1.0.0",
				description: "Greeting API",
			},
			servers: [{ url: "http://localhost:3000", description: "Local Server" }],
		},
	}),
);

export default app;
