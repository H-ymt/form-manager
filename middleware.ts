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
    return null;
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

  // 静的ファイル、API、認証エンドポイントはスキップ
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // 静的ファイル (.ico, .png, etc.)
  ) {
    return NextResponse.next();
  }

  // 認証関連のパスはリライトしない
  if (isAuthPath(pathname)) {
    return NextResponse.next();
  }

  const subdomain = getSubdomain(request);

  // サブドメインがない場合 → マーケティングサイト or プラットフォーム管理画面
  if (!subdomain) {
    return NextResponse.next();
  }

  // admin サブドメイン → プラットフォーム管理画面
  if (subdomain === "admin") {
    // admin サブドメインの場合、/platform-admin へリライト
    const url = request.nextUrl.clone();
    url.pathname = `/platform-admin${pathname}`;
    return NextResponse.rewrite(url);
  }

  // 予約済みサブドメインはブロック
  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return NextResponse.next();
  }

  // テナントサブドメイン → テナント管理画面
  // ヘッダーにテナント情報を追加してリライト
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-slug", subdomain);

  const url = request.nextUrl.clone();
  url.pathname = `/tenant${pathname}`;

  return NextResponse.rewrite(url, {
    headers: requestHeaders,
  });
}

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのパスにマッチ:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
