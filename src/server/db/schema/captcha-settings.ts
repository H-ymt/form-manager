import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const recaptchaSettings = sqliteTable("recaptcha_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteKey: text("site_key").notNull(),
  secretKey: text("secret_key").notNull(),
  threshold: real("threshold").default(0.5).notNull(),
  isEnabled: integer("is_enabled", { mode: "boolean" })
    .default(false)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const turnstileSettings = sqliteTable("turnstile_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteKey: text("site_key").notNull(),
  secretKey: text("secret_key").notNull(),
  isEnabled: integer("is_enabled", { mode: "boolean" })
    .default(false)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export type RecaptchaSettings = typeof recaptchaSettings.$inferSelect;
export type TurnstileSettings = typeof turnstileSettings.$inferSelect;
