import { zValidator } from "@hono/zod-validator";
import { eq, asc } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/server/db";
import { formFields } from "@/server/db/schema";

const formFieldsRoutes = new Hono();

const createFormFieldSchema = z.object({
  fieldKey: z.string().min(1),
  fieldType: z.enum(["text", "textarea", "email", "tel", "date", "select", "radio", "checkbox"]),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  validationRules: z.array(z.string()).optional(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  isRequired: z.boolean(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});

const updateFormFieldSchema = createFormFieldSchema.partial();

const bulkUpdateOrderSchema = z.object({
  fields: z.array(
    z.object({
      id: z.number(),
      sortOrder: z.number(),
    }),
  ),
});

// List all form fields
formFieldsRoutes.get("/", async (c) => {
  const fields = await db.select().from(formFields).orderBy(asc(formFields.sortOrder));

  return c.json({ data: fields });
});

// Get a single form field
formFieldsRoutes.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [field] = await db.select().from(formFields).where(eq(formFields.id, id));

  if (!field) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json({ data: field });
});

// Create a form field
formFieldsRoutes.post("/", zValidator("json", createFormFieldSchema), async (c) => {
  const data = c.req.valid("json");
  const [field] = await db.insert(formFields).values(data).returning();
  return c.json({ data: field }, 201);
});

// Update a form field
formFieldsRoutes.put("/:id", zValidator("json", updateFormFieldSchema), async (c) => {
  const id = Number(c.req.param("id"));
  const data = c.req.valid("json");
  const [field] = await db
    .update(formFields)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(formFields.id, id))
    .returning();

  if (!field) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ data: field });
});

// Delete a form field
formFieldsRoutes.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await db.delete(formFields).where(eq(formFields.id, id));
  return c.body(null, 204);
});

// Bulk update sort order
formFieldsRoutes.put("/bulk-update-order", zValidator("json", bulkUpdateOrderSchema), async (c) => {
  const { fields } = c.req.valid("json");

  for (const field of fields) {
    await db
      .update(formFields)
      .set({ sortOrder: field.sortOrder, updatedAt: new Date() })
      .where(eq(formFields.id, field.id));
  }

  return c.body(null, 204);
});

export { formFieldsRoutes };
