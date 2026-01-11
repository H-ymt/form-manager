import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { organizations } from "./organizations";

export const mailTemplates = sqliteTable(
  "mail_templates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["admin", "user"] }).notNull(),
    isEnabled: integer("is_enabled", { mode: "boolean" })
      .default(true)
      .notNull(),
    subject: text("subject").notNull(),
    bodyHtml: text("body_html").notNull(),
    bodyText: text("body_text").notNull(),
    fromAddress: text("from_address"),
    fromName: text("from_name"),
    replyTo: text("reply_to"),
    cc: text("cc", { mode: "json" }).$type<string[]>(),
    bcc: text("bcc", { mode: "json" }).$type<string[]>(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [index("mail_templates_org_idx").on(table.organizationId)],
);

export type MailTemplate = typeof mailTemplates.$inferSelect;
export type NewMailTemplate = typeof mailTemplates.$inferInsert;
