import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const csvFieldSettings = sqliteTable("csv_field_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fieldType: text("field_type", { enum: ["fixed", "custom"] }).notNull(),
  fieldKey: text("field_key"),
  displayName: text("display_name").notNull(),
  defaultValue: text("default_value"),
  sortOrder: integer("sort_order").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export type CsvFieldSetting = typeof csvFieldSettings.$inferSelect;
export type NewCsvFieldSetting = typeof csvFieldSettings.$inferInsert;
