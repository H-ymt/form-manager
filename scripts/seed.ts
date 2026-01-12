import { config } from "dotenv";

config({ path: ".env.local" });

import { createClient } from "@libsql/client";
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";

import { account, user } from "../src/server/db/schema/auth";
import { formFields } from "../src/server/db/schema/form-fields";
import { mailTemplates } from "../src/server/db/schema/mail-templates";
import {
  organizationMembers,
  organizations,
} from "../src/server/db/schema/organizations";

const url = process.env.TURSO_DATABASE_URL!;
const isLocalFile = url.startsWith("file:");

const client = createClient({
  url,
  authToken: isLocalFile ? undefined : process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

// Generate a unique ID (similar to nanoid)
function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 21);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string): Promise<string> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  // Better Auth と同じscryptパラメータを使用
  const key = await scryptAsync(password.normalize("NFKC"), salt, {
    N: 16384,
    r: 16,
    p: 1,
    dkLen: 64,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${toHex(key)}`;
}

async function seed() {
  console.log("Seeding database...");

  // Create default organization if not exists
  const existingOrgs = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "default"));

  let organizationId: string;

  if (existingOrgs.length === 0) {
    organizationId = generateId();
    await db.insert(organizations).values({
      id: organizationId,
      name: "Default Organization",
      slug: "default",
    });
    console.log("Created default organization");
  } else {
    organizationId = existingOrgs[0].id;
    console.log("Default organization already exists");
  }

  // Create tenant1 organization for testing
  const existingTenant1 = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "tenant1"));

  let tenant1OrganizationId: string;

  if (existingTenant1.length === 0) {
    tenant1OrganizationId = generateId();
    await db.insert(organizations).values({
      id: tenant1OrganizationId,
      name: "テストテナント1",
      slug: "tenant1",
      adminEmail: "admin@example.com",
    });
    console.log("Created tenant1 organization");
  } else {
    tenant1OrganizationId = existingTenant1[0].id;
    console.log("Tenant1 organization already exists");
  }

  // Delete existing admin user if exists
  const existingUsers = await db
    .select()
    .from(user)
    .where(eq(user.email, "admin@example.com"));
  if (existingUsers.length > 0) {
    console.log("Deleting existing admin user...");
    const existingUser = existingUsers[0];
    await db
      .delete(organizationMembers)
      .where(eq(organizationMembers.userId, existingUser.id));
    await db.delete(account).where(eq(account.userId, existingUser.id));
    await db.delete(user).where(eq(user.id, existingUser.id));
  }

  // Create admin user directly in DB (no API call needed)
  console.log("Creating admin user...");
  const adminEmail = "admin@example.com";
  const adminPassword = "Admin@123456!";

  const userId = generateId();
  await db.insert(user).values({
    id: userId,
    email: adminEmail,
    name: "Admin",
    emailVerified: true,
  });

  const hashedPassword = await hashPassword(adminPassword);
  await db.insert(account).values({
    id: generateId(),
    userId,
    accountId: userId,
    providerId: "credential",
    password: hashedPassword,
  });

  // Add admin as owner of the default organization
  await db.insert(organizationMembers).values({
    id: generateId(),
    organizationId,
    userId,
    role: "owner",
  });
  console.log("Added admin user as owner of default organization");

  // Add admin as owner of tenant1 organization
  await db.insert(organizationMembers).values({
    id: generateId(),
    organizationId: tenant1OrganizationId,
    userId,
    role: "owner",
  });
  console.log("Added admin user as owner of tenant1 organization");

  console.log("Created admin user: admin@example.com / Admin@123456!");

  // Check if form fields already exist for this organization
  const existingFields = await db
    .select()
    .from(formFields)
    .where(eq(formFields.organizationId, organizationId));

  if (existingFields.length === 0) {
    // Create sample form fields
    const sampleFields = [
      {
        organizationId,
        fieldKey: "name",
        fieldType: "text" as const,
        label: "お名前",
        placeholder: "山田太郎",
        isRequired: true,
        sortOrder: 0,
        isActive: true,
      },
      {
        organizationId,
        fieldKey: "email",
        fieldType: "email" as const,
        label: "メールアドレス",
        placeholder: "example@email.com",
        isRequired: true,
        sortOrder: 1,
        isActive: true,
      },
      {
        organizationId,
        fieldKey: "phone",
        fieldType: "tel" as const,
        label: "電話番号",
        placeholder: "090-1234-5678",
        isRequired: false,
        sortOrder: 2,
        isActive: true,
      },
      {
        organizationId,
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

  // Check if mail templates already exist for this organization
  const existingTemplates = await db
    .select()
    .from(mailTemplates)
    .where(eq(mailTemplates.organizationId, organizationId));

  if (existingTemplates.length === 0) {
    await db.insert(mailTemplates).values({
      organizationId,
      type: "admin",
      isEnabled: true,
      subject: "【お問い合わせ】{{name}}様からのお問い合わせ",
      bodyHtml: `
<h1>新しいお問い合わせがありました</h1>
<ul>
  <li><strong>名前:</strong> {{name}}</li>
  <li><strong>メール:</strong> {{email}}</li>
  <li><strong>電話:</strong> {{phone}}</li>
  <li><strong>組織:</strong> {{organization.name}}</li>
</ul>
<h2>お問い合わせ内容</h2>
<p>{{message}}</p>
`,
      bodyText: `新しいお問い合わせがありました

名前: {{name}}
メール: {{email}}
電話: {{phone}}
組織: {{organization.name}}

お問い合わせ内容:
{{message}}`,
    });

    await db.insert(mailTemplates).values({
      organizationId,
      type: "user",
      isEnabled: true,
      subject: "【{{organization.name}}】お問い合わせを受け付けました",
      bodyHtml: `
<h1>お問い合わせありがとうございます</h1>
<p>以下の内容で受け付けました。</p>
<ul>
  <li><strong>名前:</strong> {{name}}</li>
  <li><strong>メール:</strong> {{email}}</li>
  <li><strong>電話:</strong> {{phone}}</li>
</ul>
<h2>お問い合わせ内容</h2>
<p>{{message}}</p>
<p>確認次第、折り返しご連絡いたします。</p>
`,
      bodyText: `お問い合わせありがとうございます

以下の内容で受け付けました。

名前: {{name}}
メール: {{email}}
電話: {{phone}}

お問い合わせ内容:
{{message}}

確認次第、折り返しご連絡いたします。`,
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
