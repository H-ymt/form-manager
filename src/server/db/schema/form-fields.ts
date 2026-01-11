import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { organizations } from "./organizations";

export const formFields = sqliteTable(
  "form_fields",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    fieldKey: text("field_key").notNull(),
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
    validationRules: text("validation_rules", { mode: "json" }).$type<
      string[]
    >(),
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
  },
  (table) => [
    index("form_fields_org_idx").on(table.organizationId),
    uniqueIndex("form_fields_org_key_idx").on(
      table.organizationId,
      table.fieldKey,
    ),
  ],
);

export type FormField = typeof formFields.$inferSelect;
export type NewFormField = typeof formFields.$inferInsert;
