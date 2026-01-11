import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { auth } from "@/server/auth";
import { db } from "@/server/db";
import type { Organization } from "@/server/db/schema";
import { mailTemplates } from "@/server/db/schema";

type Variables = {
  user: typeof auth.$Infer.Session.user;
  session: typeof auth.$Infer.Session.session;
  organization: Organization;
  organizationId: string;
};

const mailTemplatesRoutes = new Hono<{ Variables: Variables }>();

const updateMailTemplateSchema = z.object({
  isEnabled: z.boolean().optional(),
  subject: z.string().min(1).optional(),
  bodyHtml: z.string().optional(),
  bodyText: z.string().optional(),
  fromAddress: z.string().email().optional().nullable(),
  fromName: z.string().optional().nullable(),
  replyTo: z.string().email().optional().nullable(),
  cc: z.array(z.string().email()).optional().nullable(),
  bcc: z.array(z.string().email()).optional().nullable(),
});

// List all mail templates (tenant-scoped)
mailTemplatesRoutes.get("/", async (c) => {
  const organizationId = c.get("organizationId");

  const templates = await db
    .select()
    .from(mailTemplates)
    .where(eq(mailTemplates.organizationId, organizationId));

  return c.json({ data: templates });
});

// Get a mail template by type
mailTemplatesRoutes.get("/:type", async (c) => {
  const organizationId = c.get("organizationId");
  const type = c.req.param("type") as "admin" | "user";

  const [template] = await db
    .select()
    .from(mailTemplates)
    .where(
      and(
        eq(mailTemplates.organizationId, organizationId),
        eq(mailTemplates.type, type),
      ),
    );

  if (!template) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json({ data: template });
});

// Update a mail template
mailTemplatesRoutes.put(
  "/:type",
  zValidator("json", updateMailTemplateSchema),
  async (c) => {
    const organizationId = c.get("organizationId");
    const type = c.req.param("type") as "admin" | "user";
    const data = c.req.valid("json");

    const [existing] = await db
      .select()
      .from(mailTemplates)
      .where(
        and(
          eq(mailTemplates.organizationId, organizationId),
          eq(mailTemplates.type, type),
        ),
      );

    if (!existing) {
      // Create if not exists
      const [template] = await db
        .insert(mailTemplates)
        .values({
          organizationId,
          type,
          subject: data.subject || "",
          bodyHtml: data.bodyHtml || "",
          bodyText: data.bodyText || "",
          ...data,
        })
        .returning();
      return c.json({ data: template }, 201);
    }

    const [template] = await db
      .update(mailTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(mailTemplates.organizationId, organizationId),
          eq(mailTemplates.type, type),
        ),
      )
      .returning();

    return c.json({ data: template });
  },
);

export { mailTemplatesRoutes };
