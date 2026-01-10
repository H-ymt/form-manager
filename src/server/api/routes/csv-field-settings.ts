import { zValidator } from "@hono/zod-validator";
import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/server/db";
import { csvFieldSettings } from "@/server/db/schema";

const csvFieldSettingsRoutes = new Hono();

const createCsvFieldSettingSchema = z.object({
  fieldType: z.enum(["fixed", "custom"]),
  fieldKey: z.string().optional().nullable(),
  displayName: z.string().min(1),
  defaultValue: z.string().optional().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});

const updateCsvFieldSettingSchema = createCsvFieldSettingSchema.partial();

const bulkUpdateSchema = z.object({
  settings: z.array(
    z.object({
      id: z.number(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }),
  ),
});

// List all CSV field settings
csvFieldSettingsRoutes.get("/", async (c) => {
  const settings = await db
    .select()
    .from(csvFieldSettings)
    .orderBy(asc(csvFieldSettings.sortOrder));

  return c.json({ data: settings });
});

// Create a CSV field setting
csvFieldSettingsRoutes.post(
  "/",
  zValidator("json", createCsvFieldSettingSchema),
  async (c) => {
    const data = c.req.valid("json");
    const [setting] = await db
      .insert(csvFieldSettings)
      .values(data)
      .returning();
    return c.json({ data: setting }, 201);
  },
);

// Update a CSV field setting
csvFieldSettingsRoutes.put(
  "/:id",
  zValidator("json", updateCsvFieldSettingSchema),
  async (c) => {
    const id = Number(c.req.param("id"));
    const data = c.req.valid("json");
    const [setting] = await db
      .update(csvFieldSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(csvFieldSettings.id, id))
      .returning();

    if (!setting) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json({ data: setting });
  },
);

// Delete a CSV field setting
csvFieldSettingsRoutes.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await db.delete(csvFieldSettings).where(eq(csvFieldSettings.id, id));
  return c.body(null, 204);
});

// Bulk update
csvFieldSettingsRoutes.put(
  "/bulk-update",
  zValidator("json", bulkUpdateSchema),
  async (c) => {
    const { settings } = c.req.valid("json");

    for (const setting of settings) {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (setting.sortOrder !== undefined) {
        updateData.sortOrder = setting.sortOrder;
      }
      if (setting.isActive !== undefined) {
        updateData.isActive = setting.isActive;
      }
      await db
        .update(csvFieldSettings)
        .set(updateData)
        .where(eq(csvFieldSettings.id, setting.id));
    }

    return c.body(null, 204);
  },
);

export { csvFieldSettingsRoutes };
