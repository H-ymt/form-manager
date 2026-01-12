import { and, count, desc, eq, isNotNull, isNull, type SQL } from "drizzle-orm";
import { db } from "./index";
import {
  csvFieldSettings,
  entries,
  formFields,
  mailTemplates,
  recaptchaSettings,
  turnstileSettings,
} from "./schema";

// Mail Templates
export async function getMailTemplates(organizationId: string) {
  return db
    .select()
    .from(mailTemplates)
    .where(eq(mailTemplates.organizationId, organizationId));
}

export async function getMailTemplateByType(
  organizationId: string,
  type: "admin" | "user",
) {
  const [template] = await db
    .select()
    .from(mailTemplates)
    .where(
      and(
        eq(mailTemplates.organizationId, organizationId),
        eq(mailTemplates.type, type),
      ),
    );
  return template ?? null;
}

// Form Fields
export async function getFormFields(organizationId: string) {
  return db
    .select()
    .from(formFields)
    .where(eq(formFields.organizationId, organizationId))
    .orderBy(formFields.sortOrder);
}

// Entries
export type EntryStatus = "all" | "active" | "deleted" | "exported";

export async function getEntries(
  organizationId: string,
  status: EntryStatus,
  page: number,
  perPage: number,
) {
  const offset = (page - 1) * perPage;

  let whereClause: SQL | undefined;
  switch (status) {
    case "active":
      whereClause = and(
        eq(entries.organizationId, organizationId),
        isNull(entries.deletedAt),
      );
      break;
    case "deleted":
      whereClause = and(
        eq(entries.organizationId, organizationId),
        isNotNull(entries.deletedAt),
      );
      break;
    case "exported":
      whereClause = and(
        eq(entries.organizationId, organizationId),
        eq(entries.isExported, true),
      );
      break;
    default:
      whereClause = eq(entries.organizationId, organizationId);
  }

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(entries)
      .where(whereClause)
      .orderBy(desc(entries.createdAt))
      .limit(perPage)
      .offset(offset),
    db.select({ count: count() }).from(entries).where(whereClause),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    data,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

// CSV Field Settings
export async function getCsvFieldSettings(organizationId: string) {
  return db
    .select()
    .from(csvFieldSettings)
    .where(eq(csvFieldSettings.organizationId, organizationId))
    .orderBy(csvFieldSettings.sortOrder);
}

// Captcha Settings
export async function getCaptchaSettings(organizationId: string) {
  const [recaptchaResult, turnstileResult] = await Promise.all([
    db
      .select()
      .from(recaptchaSettings)
      .where(eq(recaptchaSettings.organizationId, organizationId)),
    db
      .select()
      .from(turnstileSettings)
      .where(eq(turnstileSettings.organizationId, organizationId)),
  ]);

  const recaptcha = recaptchaResult[0];
  const turnstile = turnstileResult[0];

  return {
    recaptcha: recaptcha
      ? {
          siteKey: recaptcha.siteKey,
          secretKey: recaptcha.secretKey,
          threshold: recaptcha.threshold,
          isEnabled: recaptcha.isEnabled,
        }
      : null,
    turnstile: turnstile
      ? {
          siteKey: turnstile.siteKey,
          secretKey: turnstile.secretKey,
          isEnabled: turnstile.isEnabled,
        }
      : null,
  };
}
