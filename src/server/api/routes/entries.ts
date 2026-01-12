import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Session } from "@/server/auth";
import { db } from "@/server/db";
import type { Organization } from "@/server/db/schema";
import { entries } from "@/server/db/schema";

type Variables = {
  user: Session["user"];
  session: Session["session"];
  organization: Organization;
  organizationId: string;
};

const entriesRoutes = new Hono<{ Variables: Variables }>();

const listQuerySchema = z.object({
  status: z
    .enum(["unread", "exported", "deleted"])
    .optional()
    .default("unread"),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().optional().default(10),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.number()),
});

// List entries (tenant-scoped)
entriesRoutes.get("/", zValidator("query", listQuerySchema), async (c) => {
  const organizationId = c.get("organizationId");
  const { status, page, perPage } = c.req.valid("query");
  const offset = (page - 1) * perPage;

  const orgCondition = eq(entries.organizationId, organizationId);

  let statusCondition: ReturnType<typeof and> | ReturnType<typeof isNotNull>;
  switch (status) {
    case "unread":
      statusCondition = and(
        isNull(entries.deletedAt),
        eq(entries.isExported, false),
      );
      break;
    case "exported":
      statusCondition = and(
        isNull(entries.deletedAt),
        eq(entries.isExported, true),
      );
      break;
    case "deleted":
      statusCondition = isNotNull(entries.deletedAt);
      break;
  }

  const whereCondition = and(orgCondition, statusCondition);

  const data = await db
    .select()
    .from(entries)
    .where(whereCondition)
    .orderBy(desc(entries.createdAt))
    .limit(perPage)
    .offset(offset);

  const [countResult] = await db
    .select({ count: entries.id })
    .from(entries)
    .where(whereCondition);

  return c.json({
    data,
    pagination: {
      page,
      perPage,
      total: countResult?.count ?? 0,
    },
  });
});

// Get a single entry
entriesRoutes.get("/:id", async (c) => {
  const organizationId = c.get("organizationId");
  const id = Number(c.req.param("id"));

  const [entry] = await db
    .select()
    .from(entries)
    .where(and(eq(entries.id, id), eq(entries.organizationId, organizationId)));

  if (!entry) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json({ data: entry });
});

// Soft delete an entry
entriesRoutes.delete("/:id", async (c) => {
  const organizationId = c.get("organizationId");
  const id = Number(c.req.param("id"));

  await db
    .update(entries)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(entries.id, id), eq(entries.organizationId, organizationId)));

  return c.body(null, 204);
});

// Bulk soft delete
entriesRoutes.post(
  "/bulk-delete",
  zValidator("json", bulkDeleteSchema),
  async (c) => {
    const organizationId = c.get("organizationId");
    const { ids } = c.req.valid("json");

    await db
      .update(entries)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          inArray(entries.id, ids),
          eq(entries.organizationId, organizationId),
        ),
      );

    return c.body(null, 204);
  },
);

// Restore an entry
entriesRoutes.post("/:id/restore", async (c) => {
  const organizationId = c.get("organizationId");
  const id = Number(c.req.param("id"));

  await db
    .update(entries)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(and(eq(entries.id, id), eq(entries.organizationId, organizationId)));

  return c.body(null, 204);
});

// Bulk restore
entriesRoutes.post(
  "/bulk-restore",
  zValidator("json", bulkDeleteSchema),
  async (c) => {
    const organizationId = c.get("organizationId");
    const { ids } = c.req.valid("json");

    await db
      .update(entries)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(
        and(
          inArray(entries.id, ids),
          eq(entries.organizationId, organizationId),
        ),
      );

    return c.body(null, 204);
  },
);

// Mark as exported
entriesRoutes.patch("/:id/mark-exported", async (c) => {
  const organizationId = c.get("organizationId");
  const id = Number(c.req.param("id"));

  await db
    .update(entries)
    .set({ isExported: true, updatedAt: new Date() })
    .where(and(eq(entries.id, id), eq(entries.organizationId, organizationId)));

  return c.body(null, 204);
});

// Export to CSV
entriesRoutes.post("/export", async (c) => {
  const organizationId = c.get("organizationId");

  const data = await db
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.organizationId, organizationId),
        isNull(entries.deletedAt),
        eq(entries.isExported, false),
      ),
    )
    .orderBy(desc(entries.createdAt));

  // Mark as exported
  const ids = data.map((e) => e.id);
  if (ids.length > 0) {
    await db
      .update(entries)
      .set({ isExported: true, updatedAt: new Date() })
      .where(inArray(entries.id, ids));
  }

  return c.json({ data });
});

export { entriesRoutes };
