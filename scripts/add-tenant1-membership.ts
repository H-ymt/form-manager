import { config } from "dotenv";

config({ path: ".env.local" });

import { createClient } from "@libsql/client";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { user } from "../src/server/db/schema/auth";
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

async function addMembership() {
  // Get admin user
  const users = await db
    .select()
    .from(user)
    .where(eq(user.email, "admin@example.com"));
  if (users.length === 0) {
    console.log("Admin user not found");
    return;
  }
  const adminUser = users[0];
  console.log("Found admin user:", adminUser.id);

  // Get tenant1 organization
  const orgs = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "tenant1"));
  if (orgs.length === 0) {
    console.log("tenant1 organization not found");
    return;
  }
  const tenant1Org = orgs[0];
  console.log("Found tenant1 organization:", tenant1Org.id);

  // Check existing membership
  const existingMembership = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, tenant1Org.id),
        eq(organizationMembers.userId, adminUser.id),
      ),
    );

  if (existingMembership.length > 0) {
    console.log("Membership already exists");
    return;
  }

  // Add membership
  await db.insert(organizationMembers).values({
    id: generateId(),
    organizationId: tenant1Org.id,
    userId: adminUser.id,
    role: "owner",
  });
  console.log("Added admin user as owner of tenant1 organization");
}

addMembership()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
