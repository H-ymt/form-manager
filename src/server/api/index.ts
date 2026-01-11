import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import { platformAdminMiddleware } from "./middleware/platform-admin";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { tenantMiddleware } from "./middleware/tenant";
import { captchaSettingsRoutes } from "./routes/captcha-settings";
import { csvFieldSettingsRoutes } from "./routes/csv-field-settings";
import { entriesRoutes } from "./routes/entries";
import { formFieldsRoutes } from "./routes/form-fields";
import { mailTemplatesRoutes } from "./routes/mail-templates";
import { organizationsRoutes } from "./routes/organizations";

// 共通ミドルウェアを適用したベースアプリ
const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      // ローカル開発とサブドメインを許可
      if (!origin) return null; // originがない場合はCORSヘッダーを付与しない
      if (origin.includes("localhost")) return origin;
      if (origin.includes("vercel.app")) return origin;
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
      if (rootDomain && origin.endsWith(rootDomain)) return origin;
      return null; // 許可されないoriginはnullを返す
    },
    credentials: true,
  }),
);
app.onError(errorHandler);

// レートリミットを全APIに適用
app.use("/api/*", rateLimitMiddleware);

// プラットフォーム管理API用ミドルウェア（認証 + 管理者権限が必要）
app.use("/api/platform/*", authMiddleware);
app.use("/api/platform/*", platformAdminMiddleware);

// テナント管理API用ミドルウェア
app.use("/api/admin/*", authMiddleware);
app.use("/api/admin/*", tenantMiddleware);

// ルート定義（型情報を保持するためにチェーン）
const routes = app
  .route("/api/platform/organizations", organizationsRoutes)
  .route("/api/admin/form-fields", formFieldsRoutes)
  .route("/api/admin/entries", entriesRoutes)
  .route("/api/admin/mail-templates", mailTemplatesRoutes)
  .route("/api/admin/csv-field-settings", csvFieldSettingsRoutes)
  .route("/api/admin/captcha-settings", captchaSettingsRoutes)
  .get("/api/admin/health", (c) => c.json({ status: "ok" }));

export default app;
export type AppType = typeof routes;
