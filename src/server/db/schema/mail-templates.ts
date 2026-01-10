import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const mailTemplates = sqliteTable("mail_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["admin", "user"] })
    .notNull()
    .unique(),
  isEnabled: integer("is_enabled", { mode: "boolean" }).default(true).notNull(),
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
});

export type MailTemplate = typeof mailTemplates.$inferSelect;
export type NewMailTemplate = typeof mailTemplates.$inferInsert;
