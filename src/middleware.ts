import { type NextRequest, NextResponse } from "next/server";

/**
 * サブドメインからテナントスラグを抽出
 * 対応環境:
 * - ローカル開発: tenant.localhost:3000
 * - Vercelプレビュー: tenant.xxx-yyy.vercel.app
 * - 本番: tenant.yourapp.com
 */
function getSubdomain(request: NextRequest): string | null {
  const hostname = request.headers.get("host") || "";

  // localhost の場合
  if (hostname.includes("localhost")) {
    const parts = hostname.split(".");
    if (parts.length > 1 && parts[0] !== "www") {
      return parts[0];
    }
    return null;
  }

  // Vercelプレビューデプロイメントの場合
  // 例: tenant.xxx-yyy-zzz.vercel.app
  if (hostname.endsWith(".vercel.app")) {
    const parts = hostname.replace(".vercel.app", "").split(".");
    if (parts.length > 1) {
      return parts[0];
    }
    // サブドメインなしの場合（例: form-manager-app.vercel.app）
    // デフォルトテナントとして扱う
    return "tenant1";
  }

  // 本番環境の場合
  // 例: tenant.yourapp.com
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (rootDomain && hostname.endsWith(rootDomain)) {
    const subdomain = hostname.replace(`.${rootDomain}`, "");
    if (subdomain && subdomain !== "www" && subdomain !== hostname) {
      return subdomain;
    }
    return null;
  }

  // カスタムドメインの場合（サブドメインなし）
  const parts = hostname.split(".");
  if (parts.length > 2) {
    const subdomain = parts[0];
    if (subdomain !== "www") {
      return subdomain;
    }
  }

  return null;
}

/**
 * 予約済みサブドメイン
 * これらはテナントとして使用不可
 */
const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "admin", // プラットフォーム管理画面
  "app",
  "dashboard",
  "help",
  "support",
  "docs",
  "status",
  "mail",
]);

/**
 * 認証関連のパス
 * これらはリライトせずにそのまま通す
 */
const AUTH_PATHS = new Set(["/login", "/forgot-password", "/password-reset"]);

/**
 * 認証パスかどうかをチェック
 */
function isAuthPath(pathname: string): boolean {
  if (AUTH_PATHS.has(pathname)) return true;
  // /password-reset/[token] のようなパスもチェック
  if (pathname.startsWith("/password-reset/")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的ファイル、認証エンドポイントはスキップ
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") // 静的ファイル (.ico, .png, etc.)
  ) {
    return NextResponse.next();
  }

  // 認証関連のパスはリライトしない
  if (isAuthPath(pathname)) {
    return NextResponse.next();
  }

  const subdomain = getSubdomain(request);

  // サブドメインがない場合 → デフォルトテナントにリダイレクト（開発時）
  if (!subdomain) {
    // 開発環境でlocalhostにアクセスした場合、tenant1にリダイレクト
    const hostname = request.headers.get("host") || "";
    if (hostname === "localhost:3000" && !pathname.startsWith("/api")) {
      const url = request.nextUrl.clone();
      url.host = "tenant1.localhost:3000";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // admin サブドメイン → プラットフォーム管理画面
  if (subdomain === "admin") {
    // APIリクエストはそのまま通す
    if (pathname.startsWith("/api")) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = `/platform-admin${pathname}`;
    return NextResponse.rewrite(url);
  }

  // 予約済みサブドメインはブロック
  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return NextResponse.next();
  }

  // テナントサブドメイン → テナント管理画面
  // ヘッダーにテナント情報を追加
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-slug", subdomain);

  // APIリクエストの場合はリライトせずにヘッダーのみ追加
  if (pathname.startsWith("/api")) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // ページリクエストの場合はリライト
  const url = request.nextUrl.clone();
  url.pathname = `/tenant${pathname}`;

  return NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのパスにマッチ:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     *
     * 注: /api はテナント情報のヘッダー追加のため含める
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
