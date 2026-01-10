import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@/server/db";
import { recaptchaSettings, turnstileSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const captchaSettingsRoutes = new Hono();

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

// Get all CAPTCHA settings
captchaSettingsRoutes.get("/", async (c) => {
  const [recaptcha] = await db.select().from(recaptchaSettings).limit(1);
  const [turnstile] = await db.select().from(turnstileSettings).limit(1);

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
    const data = c.req.valid("json");

    const [existing] = await db.select().from(recaptchaSettings).limit(1);

    if (!existing) {
      const [setting] = await db
        .insert(recaptchaSettings)
        .values(data)
        .returning();
      return c.json({ data: setting }, 201);
    }

    const [setting] = await db
      .update(recaptchaSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(recaptchaSettings.id, existing.id))
      .returning();

    return c.json({ data: setting });
  }
);

// Update Turnstile settings
captchaSettingsRoutes.put(
  "/turnstile",
  zValidator("json", turnstileSchema),
  async (c) => {
    const data = c.req.valid("json");

    const [existing] = await db.select().from(turnstileSettings).limit(1);

    if (!existing) {
      const [setting] = await db
        .insert(turnstileSettings)
        .values(data)
        .returning();
      return c.json({ data: setting }, 201);
    }

    const [setting] = await db
      .update(turnstileSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(turnstileSettings.id, existing.id))
      .returning();

    return c.json({ data: setting });
  }
);

export { captchaSettingsRoutes };
