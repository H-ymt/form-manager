import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/server/db";
import {
  recaptchaSettings,
  turnstileSettings,
} from "@/server/db/schema/captcha-settings";
import { entries } from "@/server/db/schema/entries";
import { formFields } from "@/server/db/schema/form-fields";
import { mailTemplates } from "@/server/db/schema/mail-templates";
import { organizations } from "@/server/db/schema/organizations";
import { sendTemplateMail } from "@/server/lib/mail";

const publicRoutes = new Hono();

async function verifyCaptcha(
  token: string | undefined,
  organizationId: string,
): Promise<boolean> {
  if (!token) return false;

  const [recaptcha] = await db
    .select()
    .from(recaptchaSettings)
    .where(eq(recaptchaSettings.organizationId, organizationId))
    .limit(1);

  if (recaptcha?.isEnabled) {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: recaptcha.secretKey,
          response: token,
        }),
      },
    );
    const data = await response.json();
    if (data.success && data.score >= recaptcha.threshold) {
      return true;
    }
  }

  const [turnstile] = await db
    .select()
    .from(turnstileSettings)
    .where(eq(turnstileSettings.organizationId, organizationId))
    .limit(1);

  if (turnstile?.isEnabled) {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: turnstile.secretKey,
          response: token,
        }),
      },
    );
    const data = await response.json();
    if (data.success) {
      return true;
    }
  }

  return false;
}

publicRoutes.get("/form-fields", async (c) => {
  const slug = c.req.header("x-tenant-slug");
  if (!slug) {
    return c.json({ error: "Tenant slug required" }, 400);
  }

  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const fields = await db
    .select()
    .from(formFields)
    .where(eq(formFields.organizationId, organization.id))
    .orderBy(formFields.sortOrder);

  return c.json({
    data: fields,
    organization: { name: organization.name },
  });
});

publicRoutes.get("/captcha-settings", async (c) => {
  const slug = c.req.header("x-tenant-slug");
  if (!slug) {
    return c.json({ error: "Tenant slug required" }, 400);
  }

  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const [recaptcha] = await db
    .select({
      siteKey: recaptchaSettings.siteKey,
      isEnabled: recaptchaSettings.isEnabled,
    })
    .from(recaptchaSettings)
    .where(eq(recaptchaSettings.organizationId, organization.id))
    .limit(1);

  const [turnstile] = await db
    .select({
      siteKey: turnstileSettings.siteKey,
      isEnabled: turnstileSettings.isEnabled,
    })
    .from(turnstileSettings)
    .where(eq(turnstileSettings.organizationId, organization.id))
    .limit(1);

  return c.json({
    data: {
      recaptcha: recaptcha ?? null,
      turnstile: turnstile ?? null,
    },
  });
});

const submitSchema = z.object({
  captchaToken: z.string().optional(),
  formData: z.record(z.string(), z.unknown()),
});

publicRoutes.post("/submit", zValidator("json", submitSchema), async (c) => {
  const slug = c.req.header("x-tenant-slug");
  if (!slug) {
    return c.json({ error: "Tenant slug required" }, 400);
  }

  const { captchaToken, formData } = c.req.valid("json");

  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const captchaValid = await verifyCaptcha(captchaToken, organization.id);
  if (!captchaValid) {
    return c.json({ error: "Invalid captcha" }, 400);
  }

  const fields = await db
    .select()
    .from(formFields)
    .where(eq(formFields.organizationId, organization.id));

  for (const field of fields) {
    if (field.isRequired && !formData[field.fieldKey]) {
      return c.json({ error: `${field.label}は必須です` }, 400);
    }

    if (field.fieldType === "email" && formData[field.fieldKey]) {
      const email = String(formData[field.fieldKey]);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return c.json({ error: `${field.label}の形式が正しくありません` }, 400);
      }
    }
  }

  const [entry] = await db
    .insert(entries)
    .values({
      organizationId: organization.id,
      formData,
    })
    .returning();

  const [userTemplate] = await db
    .select()
    .from(mailTemplates)
    .where(
      and(
        eq(mailTemplates.organizationId, organization.id),
        eq(mailTemplates.type, "user"),
      ),
    );

  const [adminTemplate] = await db
    .select()
    .from(mailTemplates)
    .where(
      and(
        eq(mailTemplates.organizationId, organization.id),
        eq(mailTemplates.type, "admin"),
      ),
    );

  if (userTemplate?.isEnabled) {
    const emailField = fields.find((f) => f.fieldType === "email");
    const userEmail = emailField
      ? String(formData[emailField.fieldKey] ?? "")
      : null;

    if (userEmail) {
      try {
        await sendTemplateMail(userTemplate, formData, organization, userEmail);
      } catch (error) {
        console.error("Failed to send user email:", error);
      }
    }
  }

  if (adminTemplate?.isEnabled && organization.adminEmail) {
    try {
      await sendTemplateMail(
        adminTemplate,
        formData,
        organization,
        organization.adminEmail,
      );
    } catch (error) {
      console.error("Failed to send admin email:", error);
    }
  }

  return c.json({ success: true, entryId: entry.id });
});

export { publicRoutes };
