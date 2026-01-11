import { zValidator } from "@hono/zod-validator";
import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { auth } from "@/server/auth";
import { db } from "@/server/db";
import type { Organization } from "@/server/db/schema";
import { formFields } from "@/server/db/schema";

type Variables = {
  user: typeof auth.$Infer.Session.user;
  session: typeof auth.$Infer.Session.session;
  organization: Organization;
  organizationId: string;
};

const formFieldsRoutes = new Hono<{ Variables: Variables }>();

const createFormFieldSchema = z.object({
  fieldKey: z.string().min(1),
  fieldType: z.enum([
    "text",
    "textarea",
    "email",
    "tel",
    "date",
    "select",
    "radio",
    "checkbox",
  ]),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  validationRules: z.array(z.string()).optional(),
  options: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
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

// List all form fields (tenant-scoped)
formFieldsRoutes.get("/", async (c) => {
  const organizationId = c.get("organizationId");

  const fields = await db
    .select()
    .from(formFields)
    .where(eq(formFields.organizationId, organizationId))
    .orderBy(asc(formFields.sortOrder));

  return c.json({ data: fields });
});

// Get a single form field
formFieldsRoutes.get("/:id", async (c) => {
  const organizationId = c.get("organizationId");
  const id = Number(c.req.param("id"));

  const [field] = await db
    .select()
    .from(formFields)
    .where(
      and(eq(formFields.id, id), eq(formFields.organizationId, organizationId)),
    );

  if (!field) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json({ data: field });
});

// Create a form field
formFieldsRoutes.post(
  "/",
  zValidator("json", createFormFieldSchema),
  async (c) => {
    const organizationId = c.get("organizationId");
    const data = c.req.valid("json");

    const [field] = await db
      .insert(formFields)
      .values({ ...data, organizationId })
      .returning();

    return c.json({ data: field }, 201);
  },
);

// Update a form field
formFieldsRoutes.put(
  "/:id",
  zValidator("json", updateFormFieldSchema),
  async (c) => {
    const organizationId = c.get("organizationId");
    const id = Number(c.req.param("id"));
    const data = c.req.valid("json");

    const [field] = await db
      .update(formFields)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(formFields.id, id),
          eq(formFields.organizationId, organizationId),
        ),
      )
      .returning();

    if (!field) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json({ data: field });
  },
);

// Delete a form field
formFieldsRoutes.delete("/:id", async (c) => {
  const organizationId = c.get("organizationId");
  const id = Number(c.req.param("id"));

  await db
    .delete(formFields)
    .where(
      and(eq(formFields.id, id), eq(formFields.organizationId, organizationId)),
    );

  return c.body(null, 204);
});

// Bulk update sort order
formFieldsRoutes.put(
  "/bulk-update-order",
  zValidator("json", bulkUpdateOrderSchema),
  async (c) => {
    const organizationId = c.get("organizationId");
    const { fields } = c.req.valid("json");

    for (const field of fields) {
      await db
        .update(formFields)
        .set({ sortOrder: field.sortOrder, updatedAt: new Date() })
        .where(
          and(
            eq(formFields.id, field.id),
            eq(formFields.organizationId, organizationId),
          ),
        );
    }

    return c.body(null, 204);
  },
);

export { formFieldsRoutes };
