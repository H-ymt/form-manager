import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import type { Session } from "@/server/auth";
import { db } from "@/server/db";
import type { Organization } from "@/server/db/schema";
import { organizationMembers, organizations } from "@/server/db/schema";

type TenantVariables = {
  user: Session["user"];
  session: Session["session"];
  organization: Organization;
  organizationId: string;
};

/**
 * テナントミドルウェア
 * x-tenant-slugヘッダーまたはx-organization-idヘッダーから組織を取得し、
 * ユーザーがその組織のメンバーかどうかを検証する
 */
export const tenantMiddleware = createMiddleware<{
  Variables: TenantVariables;
}>(async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // ヘッダーからテナント情報を取得
  const tenantSlug = c.req.header("x-tenant-slug");
  const organizationId = c.req.header("x-organization-id");

  let organization: Organization | undefined;

  if (organizationId) {
    // organizationIdが指定されている場合はそれを使用
    organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });
  } else if (tenantSlug) {
    // slugが指定されている場合はslugで検索
    organization = await db.query.organizations.findFirst({
      where: eq(organizations.slug, tenantSlug),
    });
  }

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  // ユーザーがこの組織のメンバーかどうかを確認
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.organizationId, organization.id),
      eq(organizationMembers.userId, user.id),
    ),
  });

  if (!membership) {
    return c.json({ error: "You are not a member of this organization" }, 403);
  }

  c.set("organization", organization);
  c.set("organizationId", organization.id);

  await next();
});

/**
 * オプショナルなテナントミドルウェア
 * テナント情報がある場合のみ設定する（プラットフォーム管理APIなどで使用）
 */
export const optionalTenantMiddleware = createMiddleware<{
  Variables: Partial<TenantVariables>;
}>(async (c, next) => {
  const tenantSlug = c.req.header("x-tenant-slug");
  const organizationId = c.req.header("x-organization-id");

  if (organizationId || tenantSlug) {
    let organization: Organization | undefined;

    if (organizationId) {
      organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
      });
    } else if (tenantSlug) {
      organization = await db.query.organizations.findFirst({
        where: eq(organizations.slug, tenantSlug),
      });
    }

    if (organization) {
      c.set("organization", organization);
      c.set("organizationId", organization.id);
    }
  }

  await next();
});
