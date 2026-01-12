import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

const url = process.env.TURSO_DATABASE_URL!;
const isLocalFile = url.startsWith("file:");

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./src/server/db/migrations",
  dialect: isLocalFile ? "sqlite" : "turso",
  dbCredentials: isLocalFile
    ? { url }
    : { url, authToken: process.env.TURSO_AUTH_TOKEN },
});
