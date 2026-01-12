import { type Client, createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

import * as schema from "./schema";

let client: Client | null = null;
let database: LibSQLDatabase<typeof schema> | null = null;

function getClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      throw new Error("TURSO_DATABASE_URL environment variable is not set");
    }

    // ローカルHTTP (http://localhost) またはリモートの場合はauthToken設定
    const isLocal =
      url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1");
    client = createClient({
      url,
      authToken: isLocal ? undefined : process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export const db: LibSQLDatabase<typeof schema> = new Proxy(
  {} as LibSQLDatabase<typeof schema>,
  {
    get(_target, prop) {
      if (!database) {
        database = drizzle(getClient(), { schema });
      }
      return database[prop as keyof typeof database];
    },
  },
);
