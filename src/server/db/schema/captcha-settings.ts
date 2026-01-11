import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { organizations } from "./organizations";

export const recaptchaSettings = sqliteTable(
  "recaptcha_settings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    organizationId: text("organization_id")
      .notNull()
      .unique()
      .references(() => organizations.id, { onDelete: "cascade" }),
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
  },
  (table) => [index("recaptcha_settings_org_idx").on(table.organizationId)],
);

export const turnstileSettings = sqliteTable(
  "turnstile_settings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    organizationId: text("organization_id")
      .notNull()
      .unique()
      .references(() => organizations.id, { onDelete: "cascade" }),
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
  },
  (table) => [index("turnstile_settings_org_idx").on(table.organizationId)],
);

export type RecaptchaSettings = typeof recaptchaSettings.$inferSelect;
export type TurnstileSettings = typeof turnstileSettings.$inferSelect;
