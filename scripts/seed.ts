import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { user, account } from "../src/server/db/schema/auth";
import { formFields } from "../src/server/db/schema/form-fields";
import { mailTemplates } from "../src/server/db/schema/mail-templates";
import { eq } from "drizzle-orm";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

async function seed() {
  console.log("Seeding database...");

  // まず既存のadminユーザーを削除
  const existingUsers = await db.select().from(user).where(eq(user.email, "admin@example.com"));
  if (existingUsers.length > 0) {
    console.log("Deleting existing admin user...");
    const existingUser = existingUsers[0];
    await db.delete(account).where(eq(account.userId, existingUser.id));
    await db.delete(user).where(eq(user.id, existingUser.id));
  }

  // Better AuthのsignUp APIを使用してユーザーを作成
  console.log("Creating admin user via Better Auth API...");

  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const signUpResponse = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": baseUrl,
    },
    body: JSON.stringify({
      email: "admin@example.com",
      password: "admin123",
      name: "Admin",
    }),
  });

  if (!signUpResponse.ok) {
    const errorText = await signUpResponse.text();
    throw new Error(`Failed to create admin user: ${signUpResponse.status} ${errorText}`);
  }

  console.log("Created admin user: admin@example.com / admin123");

  // Check if form fields already exist
  const existingFields = await db.select().from(formFields);
  if (existingFields.length === 0) {
    // Create sample form fields
    const sampleFields = [
      {
        fieldKey: "name",
        fieldType: "text" as const,
        label: "お名前",
        placeholder: "山田太郎",
        isRequired: true,
        sortOrder: 0,
        isActive: true,
      },
      {
        fieldKey: "email",
        fieldType: "email" as const,
        label: "メールアドレス",
        placeholder: "example@email.com",
        isRequired: true,
        sortOrder: 1,
        isActive: true,
      },
      {
        fieldKey: "phone",
        fieldType: "tel" as const,
        label: "電話番号",
        placeholder: "090-1234-5678",
        isRequired: false,
        sortOrder: 2,
        isActive: true,
      },
      {
        fieldKey: "message",
        fieldType: "textarea" as const,
        label: "お問い合わせ内容",
        placeholder: "お問い合わせ内容をご記入ください",
        isRequired: true,
        sortOrder: 3,
        isActive: true,
      },
    ];

    for (const field of sampleFields) {
      await db.insert(formFields).values(field);
    }
    console.log("Created sample form fields");
  } else {
    console.log("Form fields already exist, skipping...");
  }

  // Check if mail templates already exist
  const existingTemplates = await db.select().from(mailTemplates);
  if (existingTemplates.length === 0) {
    // Create mail templates
    await db.insert(mailTemplates).values({
      type: "admin",
      isEnabled: true,
      subject: "【お問い合わせ】新しいお問い合わせがありました",
      bodyHtml: "<p>新しいお問い合わせがありました。</p>",
      bodyText: "新しいお問い合わせがありました。",
    });

    await db.insert(mailTemplates).values({
      type: "user",
      isEnabled: true,
      subject: "【お問い合わせ】お問い合わせを受け付けました",
      bodyHtml: "<p>お問い合わせありがとうございます。</p>",
      bodyText: "お問い合わせありがとうございます。",
    });
    console.log("Created mail templates");
  } else {
    console.log("Mail templates already exist, skipping...");
  }

  console.log("Seeding completed!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
