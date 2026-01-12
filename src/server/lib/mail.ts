import { Resend } from "resend";
import type { MailTemplate } from "@/server/db/schema/mail-templates";
import type { Organization } from "@/server/db/schema/organizations";

let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export function replaceTemplatePlaceholders(
  template: string,
  formData: Record<string, unknown>,
  organization: Organization,
): string {
  let result = template;

  result = result.replace(/\{\{organization\.name\}\}/g, organization.name);
  result = result.replace(/\{\{organization\.slug\}\}/g, organization.slug);

  Object.entries(formData).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, String(value ?? ""));
  });

  return result;
}

export async function sendMail(options: MailOptions): Promise<void> {
  if (!resend || !process.env.RESEND_FROM_EMAIL) {
    console.warn("Resend not configured, skipping email send");
    return;
  }

  const fromName = options.fromName ?? "";
  const from = options.fromName
    ? `${fromName} <${process.env.RESEND_FROM_EMAIL}>`
    : process.env.RESEND_FROM_EMAIL!;

  await resend.emails.send({
    from,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
    cc: options.cc,
    bcc: options.bcc,
  });
}

export async function sendTemplateMail(
  template: MailTemplate,
  formData: Record<string, unknown>,
  organization: Organization,
  recipientEmail: string,
): Promise<void> {
  const html = replaceTemplatePlaceholders(
    template.bodyHtml,
    formData,
    organization,
  );
  const text = replaceTemplatePlaceholders(
    template.bodyText,
    formData,
    organization,
  );

  await sendMail({
    to: recipientEmail,
    subject: template.subject,
    html,
    text,
    fromName: template.fromName ?? undefined,
    replyTo: template.replyTo ?? undefined,
    cc: template.cc ?? undefined,
    bcc: template.bcc ?? undefined,
  });
}
