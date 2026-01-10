import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const formFields = sqliteTable("form_fields", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fieldKey: text("field_key").notNull().unique(),
  fieldType: text("field_type", {
    enum: [
      "text",
      "textarea",
      "email",
      "tel",
      "date",
      "select",
      "radio",
      "checkbox",
    ],
  }).notNull(),
  label: text("label").notNull(),
  placeholder: text("placeholder"),
  validationRules: text("validation_rules", { mode: "json" }).$type<string[]>(),
  options: text("options", { mode: "json" }).$type<
    { value: string; label: string }[]
  >(),
  isRequired: integer("is_required", { mode: "boolean" })
    .default(false)
    .notNull(),
  sortOrder: integer("sort_order").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export type FormField = typeof formFields.$inferSelect;
export type NewFormField = typeof formFields.$inferInsert;
