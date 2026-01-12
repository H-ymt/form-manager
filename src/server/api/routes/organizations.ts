import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Session } from "@/server/auth";
import { db } from "@/server/db";
import { organizationMembers, organizations } from "@/server/db/schema";

type Variables = {
  user: Session["user"];
  session: Session["session"];
};

const organizationsRoutes = new Hono<{ Variables: Variables }>();

const createOrganizationSchema = z.object({
  name: z.string().min(1, "テナント名は必須です"),
  slug: z
    .string()
    .min(1, "スラッグは必須です")
    .regex(/^[a-z0-9-]+$/, "スラッグは小文字英数字とハイフンのみ使用できます"),
});

const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  logoUrl: z.string().url().nullable().optional(),
  adminEmail: z.string().email().nullable().optional(),
});

// List all organizations (for platform admin)
organizationsRoutes.get("/", async (c) => {
  const user = c.get("user");

  // TODO: プラットフォーム管理者のみがすべての組織を見れるようにする
  // 現時点では、ユーザーが所属する組織のみを返す
  const memberOrgs = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.userId, user.id),
    with: {
      // organization: true, // リレーションを設定後に有効化
    },
  });

  // 今は全組織を返す（プラットフォーム管理画面用）
  // TODO: memberOrgsを使用してユーザーが所属する組織のみを返すように修正
  void memberOrgs;
  const allOrgs = await db.select().from(organizations);
  return c.json(allOrgs);
});

// Get a single organization
organizationsRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id));

  if (!org) {
    return c.json({ error: "Organization not found" }, 404);
  }

  return c.json(org);
});

// Create a new organization
organizationsRoutes.post(
  "/",
  zValidator("json", createOrganizationSchema),
  async (c) => {
    const user = c.get("user");
    const data = c.req.valid("json");

    // スラッグの重複チェック
    const existing = await db.query.organizations.findFirst({
      where: eq(organizations.slug, data.slug),
    });

    if (existing) {
      return c.json({ error: "このスラッグは既に使用されています" }, 400);
    }

    // 組織を作成
    const id = crypto.randomUUID();
    const [org] = await db
      .insert(organizations)
      .values({
        id,
        name: data.name,
        slug: data.slug,
      })
      .returning();

    // 作成者をオーナーとして追加
    await db.insert(organizationMembers).values({
      id: crypto.randomUUID(),
      organizationId: id,
      userId: user.id,
      role: "owner",
    });

    return c.json(org, 201);
  },
);

// Update an organization
organizationsRoutes.put(
  "/:id",
  zValidator("json", updateOrganizationSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    // スラッグの重複チェック（自身以外）
    if (data.slug) {
      const slug = data.slug;
      const existing = await db.query.organizations.findFirst({
        where: (table, { and, ne }) =>
          and(eq(table.slug, slug), ne(table.id, id)),
      });

      if (existing) {
        return c.json({ error: "このスラッグは既に使用されています" }, 400);
      }
    }

    const [org] = await db
      .update(organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();

    if (!org) {
      return c.json({ error: "Organization not found" }, 404);
    }

    return c.json(org);
  },
);

// Delete an organization
organizationsRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const [org] = await db
    .delete(organizations)
    .where(eq(organizations.id, id))
    .returning();

  if (!org) {
    return c.json({ error: "Organization not found" }, 404);
  }

  return c.body(null, 204);
});

export { organizationsRoutes };
