import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

export type Bindings = {
	JWT_SECRET: string;
	API_KEYS: string;
	MCP_URL: string;
	GITHUB_TOKEN: string;
};

export type Variables = {
	client: ClientInfo;
	user: JWTPayload;
};

export type ClientInfo = {
	name: string;
	permissions: string[];
	apiKey: string;
};

export type JWTPayload = {
	client: string;
	permissions: string[];
	iat: number;
	exp: number;
};

// API Key設定（実際の本番環境では外部ストレージを使用）
const API_KEYS = new Map<string, Omit<ClientInfo, "apiKey">>([
	["admin-cli-key-1", { name: "MCP-Client-1", permissions: ["admin"] }],
	["admin-cli-key-2", { name: "MCP-Client-2", permissions: ["admin"] }],
]);

// API Key検証ミドルウェア
export const apiKeyAuthMiddleware = createMiddleware<{ Variables: Variables }>(
	async (c, next) => {
		const apiKey = c.req.header("x-api-key");

		if (!apiKey) {
			return c.json({ error: "API key is required" }, 401);
		}

		const client = API_KEYS.get(apiKey);
		if (!client) {
			return c.json({ error: "Invalid API key" }, 401);
		}

		c.set("client", { ...client, apiKey });
		await next();
	},
);

// JWT認証ミドルウェア
export const jwtAuthMiddleware = createMiddleware<{
	Variables: Variables;
	Bindings: Bindings;
}>(async (c, next) => {
	const authHeader = c.req.header("authorization");
	const token = authHeader?.replace("Bearer ", "");

	if (!token) {
		return c.json({ error: "Access token is required" }, 401);
	}

	try {
		const jwtSecret = c.env.JWT_SECRET;
		const payload = (await verify(token, jwtSecret, {
			alg: "HS256",
		})) as JWTPayload;
		c.set("user", payload);
		await next();
	} catch (_error) {
		return c.json({ error: "Invalid or expired token" }, 403);
	}
});

// Admin権限チェックミドルウェア
export const requireAdminMiddleware = createMiddleware<{
	Variables: Variables;
}>(async (c, next) => {
	const client = c.get("client");

	if (!client.permissions.includes("admin")) {
		return c.json({ error: "Admin privileges required" }, 403);
	}

	await next();
});

// 監査ログミドルウェア
export const auditLogMiddleware = createMiddleware<{ Variables: Variables }>(
	async (c, next) => {
		const client = c.get("client");
		const user = c.get("user");
		const method = c.req.method;
		const path = c.req.path;
		const timestamp = new Date().toISOString();

		console.log(
			`[AUDIT] ${timestamp} - ${method} ${path} - Client: ${client?.name || "Unknown"} - User: ${user?.client || "Unknown"}`,
		);

		await next();
	},
);
