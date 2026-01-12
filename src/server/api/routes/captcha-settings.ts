import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Session } from "@/server/auth";
import { db } from "@/server/db";
import type { Organization } from "@/server/db/schema";
import { recaptchaSettings, turnstileSettings } from "@/server/db/schema";

type Variables = {
  user: Session["user"];
  session: Session["session"];
  organization: Organization;
  organizationId: string;
};

const captchaSettingsRoutes = new Hono<{ Variables: Variables }>();

const recaptchaSchema = z.object({
  siteKey: z.string().min(1),
  secretKey: z.string().min(1),
  threshold: z.number().min(0).max(1),
  isEnabled: z.boolean(),
});

const turnstileSchema = z.object({
  siteKey: z.string().min(1),
  secretKey: z.string().min(1),
  isEnabled: z.boolean(),
});

// Get all CAPTCHA settings (tenant-scoped)
// secretKeyはAPIレスポンスから除外（セキュリティ対策）
captchaSettingsRoutes.get("/", async (c) => {
  const organizationId = c.get("organizationId");
  if (!organizationId) {
    return c.json({ error: "organizationId is required" }, 401);
  }

  const [recaptcha] = await db
    .select({
      id: recaptchaSettings.id,
      organizationId: recaptchaSettings.organizationId,
      siteKey: recaptchaSettings.siteKey,
      // secretKeyは除外
      threshold: recaptchaSettings.threshold,
      isEnabled: recaptchaSettings.isEnabled,
      createdAt: recaptchaSettings.createdAt,
      updatedAt: recaptchaSettings.updatedAt,
    })
    .from(recaptchaSettings)
    .where(eq(recaptchaSettings.organizationId, organizationId))
    .limit(1);

  const [turnstile] = await db
    .select({
      id: turnstileSettings.id,
      organizationId: turnstileSettings.organizationId,
      siteKey: turnstileSettings.siteKey,
      // secretKeyは除外
      isEnabled: turnstileSettings.isEnabled,
      createdAt: turnstileSettings.createdAt,
      updatedAt: turnstileSettings.updatedAt,
    })
    .from(turnstileSettings)
    .where(eq(turnstileSettings.organizationId, organizationId))
    .limit(1);

  return c.json({
    data: {
      recaptcha: recaptcha || null,
      turnstile: turnstile || null,
    },
  });
});

// Update reCAPTCHA settings
captchaSettingsRoutes.put(
  "/recaptcha",
  zValidator("json", recaptchaSchema),
  async (c) => {
    const organizationId = c.get("organizationId");
    if (!organizationId) {
      return c.json({ error: "organizationId is required" }, 401);
    }
    const data = c.req.valid("json");

    const [existing] = await db
      .select()
      .from(recaptchaSettings)
      .where(eq(recaptchaSettings.organizationId, organizationId))
      .limit(1);

    if (!existing) {
      const [setting] = await db
        .insert(recaptchaSettings)
        .values({ ...data, organizationId })
        .returning();
      return c.json({ data: setting }, 201);
    }

    const [setting] = await db
      .update(recaptchaSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(recaptchaSettings.organizationId, organizationId))
      .returning();

    return c.json({ data: setting });
  },
);

// Update Turnstile settings
captchaSettingsRoutes.put(
  "/turnstile",
  zValidator("json", turnstileSchema),
  async (c) => {
    const organizationId = c.get("organizationId");
    if (!organizationId) {
      return c.json({ error: "organizationId is required" }, 401);
    }
    const data = c.req.valid("json");

    const [existing] = await db
      .select()
      .from(turnstileSettings)
      .where(eq(turnstileSettings.organizationId, organizationId))
      .limit(1);

    if (!existing) {
      const [setting] = await db
        .insert(turnstileSettings)
        .values({ ...data, organizationId })
        .returning();
      return c.json({ data: setting }, 201);
    }

    const [setting] = await db
      .update(turnstileSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(turnstileSettings.organizationId, organizationId))
      .returning();

    return c.json({ data: setting });
  },
);

export { captchaSettingsRoutes };
