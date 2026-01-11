import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import type { auth } from "@/server/auth";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";

type Variables = {
  user: typeof auth.$Infer.Session.user;
  session: typeof auth.$Infer.Session.session;
};

/**
 * プラットフォーム管理者ミドルウェア
 * プラットフォーム管理者（platform_admin）ロールを持つユーザーのみアクセスを許可
 */
export const platformAdminMiddleware = createMiddleware<{
  Variables: Variables;
}>(async (c, next) => {
  const sessionUser = c.get("user");

  if (!sessionUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // DBから最新のユーザー情報を取得してロールを確認
  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, sessionUser.id));

  if (!dbUser || dbUser.role !== "platform_admin") {
    return c.json(
      {
        error: "Forbidden",
        message: "この操作にはプラットフォーム管理者権限が必要です。",
      },
      403,
    );
  }

  await next();
});
