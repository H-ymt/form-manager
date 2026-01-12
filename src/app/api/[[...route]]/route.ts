import { handle } from "hono/vercel";

import app from "@/server/api";

// Node.js runtime を使用（ローカル開発でlibsqlが動作するため）
export const runtime = "nodejs";

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
