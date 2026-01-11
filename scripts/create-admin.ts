import { config } from "dotenv";

config({ path: ".env.local" });

import { createClient } from "@libsql/client";
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { account, user } from "../src/server/db/schema/auth";
import {
  organizationMembers,
  organizations,
} from "../src/server/db/schema/organizations";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

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
  // OWASP推奨のscryptパラメータ: N=2^17, r=8, p=1 (約128MBメモリ使用)
  const key = await scryptAsync(password.normalize("NFKC"), salt, {
    N: 131072, // 2^17
    r: 8,
    p: 1,
    dkLen: 64,
    maxmem: 128 * 131072 * 8 * 2,
  });
  return `${salt}:${toHex(key)}`;
}

async function createAdminUser() {
  const email = "admin@example.com";
  const password = "Admin@123456!";
  const name = "Admin";

  // Check if user exists
  const existingUsers = await db
    .select()
    .from(user)
    .where(eq(user.email, email));

  if (existingUsers.length > 0) {
    console.log("Admin user already exists, deleting...");
    const existingUser = existingUsers[0];
    await db
      .delete(organizationMembers)
      .where(eq(organizationMembers.userId, existingUser.id));
    await db.delete(account).where(eq(account.userId, existingUser.id));
    await db.delete(user).where(eq(user.id, existingUser.id));
  }

  // Create user
  const userId = generateId();
  await db.insert(user).values({
    id: userId,
    email,
    name,
    emailVerified: true,
  });
  console.log("Created user:", userId);

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create account (credential)
  const accountId = generateId();
  await db.insert(account).values({
    id: accountId,
    userId,
    accountId: userId,
    providerId: "credential",
    password: hashedPassword,
  });
  console.log("Created account with password");

  // Get organizations
  const defaultOrg = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "default"));
  const tenant1Org = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "tenant1"));

  // Add memberships
  if (defaultOrg.length > 0) {
    await db.insert(organizationMembers).values({
      id: generateId(),
      organizationId: defaultOrg[0].id,
      userId,
      role: "owner",
    });
    console.log("Added membership for default organization");
  }

  if (tenant1Org.length > 0) {
    await db.insert(organizationMembers).values({
      id: generateId(),
      organizationId: tenant1Org[0].id,
      userId,
      role: "owner",
    });
    console.log("Added membership for tenant1 organization");
  }

  console.log("\nAdmin user created successfully!");
  console.log("Email:", email);
  console.log("Password:", password);
}

createAdminUser()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
