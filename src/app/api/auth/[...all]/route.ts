import { toNextJsHandler } from "better-auth/next-js";
import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/server/auth";

const handler = toNextJsHandler(auth);

// CORSヘッダーを追加するラッパー
function withCors(response: Response, origin: string | null): Response {
  const headers = new Headers(response.headers);

  // 許可するオリジン
  const allowedOrigins = [
    "http://localhost:3000",
    "http://admin.localhost:3000",
    "http://tenant1.localhost:3000",
  ];

  if (
    origin &&
    (allowedOrigins.includes(origin) || origin.includes("localhost"))
  ) {
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
  const url = request.nextUrl.pathname;
  console.log("[AUTH DEBUG] POST", url, "origin:", origin);

  // リクエストボディをクローンして確認
  const clonedRequest = request.clone();
  try {
    const body = await clonedRequest.json();
    console.log("[AUTH DEBUG] Body:", JSON.stringify(body));
  } catch (e) {
    console.log("[AUTH DEBUG] Could not parse body");
  }

  const response = await handler.POST(request);
  console.log("[AUTH DEBUG] Response status:", response.status);
  return withCors(response, origin);
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowedOrigins = [
    "http://localhost:3000",
    "http://admin.localhost:3000",
    "http://tenant1.localhost:3000",
  ];

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  if (
    origin &&
    (allowedOrigins.includes(origin) || origin.includes("localhost"))
  ) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return new NextResponse(null, { status: 204, headers });
}
