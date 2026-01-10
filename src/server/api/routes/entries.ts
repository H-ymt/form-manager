import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/server/db";
import { entries } from "@/server/db/schema";

const entriesRoutes = new Hono();

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

// List entries
entriesRoutes.get("/", zValidator("query", listQuerySchema), async (c) => {
  const { status, page, perPage } = c.req.valid("query");
  const offset = (page - 1) * perPage;

  let whereCondition: ReturnType<typeof and> | ReturnType<typeof isNotNull>;
  switch (status) {
    case "unread":
      whereCondition = and(
        isNull(entries.deletedAt),
        eq(entries.isExported, false),
      );
      break;
    case "exported":
      whereCondition = and(
        isNull(entries.deletedAt),
        eq(entries.isExported, true),
      );
      break;
    case "deleted":
      whereCondition = isNotNull(entries.deletedAt);
      break;
  }

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
  const id = Number(c.req.param("id"));
  const [entry] = await db.select().from(entries).where(eq(entries.id, id));

  if (!entry) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json({ data: entry });
});

// Soft delete an entry
entriesRoutes.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await db
    .update(entries)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(entries.id, id));

  return c.body(null, 204);
});

// Bulk soft delete
entriesRoutes.post(
  "/bulk-delete",
  zValidator("json", bulkDeleteSchema),
  async (c) => {
    const { ids } = c.req.valid("json");

    await db
      .update(entries)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(inArray(entries.id, ids));

    return c.body(null, 204);
  },
);

// Restore an entry
entriesRoutes.post("/:id/restore", async (c) => {
  const id = Number(c.req.param("id"));
  await db
    .update(entries)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(entries.id, id));

  return c.body(null, 204);
});

// Bulk restore
entriesRoutes.post(
  "/bulk-restore",
  zValidator("json", bulkDeleteSchema),
  async (c) => {
    const { ids } = c.req.valid("json");

    await db
      .update(entries)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(inArray(entries.id, ids));

    return c.body(null, 204);
  },
);

// Mark as exported
entriesRoutes.patch("/:id/mark-exported", async (c) => {
  const id = Number(c.req.param("id"));
  await db
    .update(entries)
    .set({ isExported: true, updatedAt: new Date() })
    .where(eq(entries.id, id));

  return c.body(null, 204);
});

// Export to CSV
entriesRoutes.post("/export", async (c) => {
  const data = await db
    .select()
    .from(entries)
    .where(and(isNull(entries.deletedAt), eq(entries.isExported, false)))
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
