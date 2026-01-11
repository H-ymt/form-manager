import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/server/db";
import type { Organization } from "@/server/db/schema";
import { organizations } from "@/server/db/schema";

/**
 * サーバーサイドでテナント情報を取得
 * ミドルウェアで設定された x-tenant-slug ヘッダーから組織を検索
 */
export async function getTenantFromHeaders(): Promise<Organization | null> {
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");

  if (!tenantSlug) {
    return null;
  }

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.slug, tenantSlug),
  });

  return organization ?? null;
}

/**
 * テナントが必須のページで使用
 * テナントが見つからない場合はnullを返す（404表示用）
 */
export async function requireTenant(): Promise<Organization | null> {
  return getTenantFromHeaders();
}
