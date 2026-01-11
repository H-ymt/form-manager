import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createMiddleware } from "hono/factory";

// Upstash Redis クライアント（環境変数が設定されている場合のみ有効）
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// 一般API用レートリミット（1分間に60リクエスト）
const generalLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "ratelimit:general",
    })
  : null;

// 認証API用レートリミット（1分間に10リクエスト - ブルートフォース対策）
const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "ratelimit:auth",
    })
  : null;

// 厳格なレートリミット（1分間に5リクエスト - パスワードリセットなど）
const strictLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "ratelimit:strict",
    })
  : null;

/**
 * IPアドレスを取得
 */
function getClientIP(request: Request): string {
  // Vercel/Cloudflareなどのプロキシヘッダーを確認
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // フォールバック
  return "unknown";
}

/**
 * 一般API用レートリミットミドルウェア
 * Redis接続エラー時はfail-open（リクエストを許可）を採用
 * - 可用性を優先し、一時的なRedis障害時もサービスを継続
 * - ただし、本番環境ではRedis障害のモニタリングを推奨
 */
export const rateLimitMiddleware = createMiddleware(async (c, next) => {
  if (!generalLimiter) {
    // Redisが設定されていない場合はスキップ
    await next();
    return;
  }

  try {
    const ip = getClientIP(c.req.raw);
    const { success, limit, remaining, reset } = await generalLimiter.limit(ip);

    // レートリミットヘッダーを設定
    c.header("X-RateLimit-Limit", limit.toString());
    c.header("X-RateLimit-Remaining", remaining.toString());
    c.header("X-RateLimit-Reset", reset.toString());

    if (!success) {
      return c.json(
        {
          error: "Too many requests",
          message:
            "リクエスト数が上限を超えました。しばらく待ってから再試行してください。",
        },
        429,
      );
    }
  } catch (error) {
    // Redis接続エラー時はfail-open（リクエストを許可）
    console.error("[RateLimit] Redis error, allowing request:", error);
  }

  await next();
});

/**
 * 認証API用レートリミットミドルウェア（ブルートフォース対策）
 * Redis接続エラー時はfail-open（リクエストを許可）を採用
 */
export const authRateLimitMiddleware = createMiddleware(async (c, next) => {
  if (!authLimiter) {
    await next();
    return;
  }

  try {
    const ip = getClientIP(c.req.raw);
    const { success, limit, remaining, reset } = await authLimiter.limit(ip);

    c.header("X-RateLimit-Limit", limit.toString());
    c.header("X-RateLimit-Remaining", remaining.toString());
    c.header("X-RateLimit-Reset", reset.toString());

    if (!success) {
      return c.json(
        {
          error: "Too many requests",
          message:
            "ログイン試行回数が上限を超えました。1分後に再試行してください。",
        },
        429,
      );
    }
  } catch (error) {
    console.error("[RateLimit] Redis error, allowing request:", error);
  }

  await next();
});

/**
 * 厳格なレートリミットミドルウェア（パスワードリセットなど）
 * Redis接続エラー時はfail-open（リクエストを許可）を採用
 */
export const strictRateLimitMiddleware = createMiddleware(async (c, next) => {
  if (!strictLimiter) {
    await next();
    return;
  }

  try {
    const ip = getClientIP(c.req.raw);
    const { success, limit, remaining, reset } = await strictLimiter.limit(ip);

    c.header("X-RateLimit-Limit", limit.toString());
    c.header("X-RateLimit-Remaining", remaining.toString());
    c.header("X-RateLimit-Reset", reset.toString());

    if (!success) {
      return c.json(
        {
          error: "Too many requests",
          message:
            "リクエスト数が上限を超えました。しばらく待ってから再試行してください。",
        },
        429,
      );
    }
  } catch (error) {
    console.error("[RateLimit] Redis error, allowing request:", error);
  }

  await next();
});
