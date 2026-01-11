import { toNextJsHandler } from "better-auth/next-js";
import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/server/auth";

const handler = toNextJsHandler(auth);

// 許可するオリジンを環境変数から取得、未設定の場合は開発用デフォルト
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [
      "http://localhost:3000",
      "http://admin.localhost:3000",
      "http://tenant1.localhost:3000",
    ];

// オリジンが許可リストに含まれているかを厳密にチェック
function isOriginAllowed(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin);
}

// CORSヘッダーを追加するラッパー
function withCors(response: Response, origin: string | null): Response {
  const headers = new Headers(response.headers);

  if (origin && isOriginAllowed(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const response = await handler.GET(request);
  return withCors(response, origin);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const response = await handler.POST(request);
  return withCors(response, origin);
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  if (origin && isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return new NextResponse(null, { status: 204, headers });
}
