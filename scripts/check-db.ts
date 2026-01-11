import { config } from "dotenv";

config({ path: ".env.local" });

import { createClient } from "@libsql/client";
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

async function check() {
  const users = await db.select().from(user);
  console.log("All users:", JSON.stringify(users, null, 2));

  const orgs = await db.select().from(organizations);
  console.log("\nAll organizations:", JSON.stringify(orgs, null, 2));

  const members = await db.select().from(organizationMembers);
  console.log("\nAll memberships:", JSON.stringify(members, null, 2));
}

check()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
