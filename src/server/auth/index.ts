import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/server/db";
import * as schema from "@/server/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  trustedOrigins: [
    "http://localhost:3000",
    "http://admin.localhost:3000",
    "http://tenant1.localhost:3000",
    // 本番環境用（環境変数から取得）
    ...(process.env.NEXT_PUBLIC_ROOT_DOMAIN
      ? [`https://*.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`]
      : []),
  ],

  advanced: {
    cookiePrefix: "form-manager",
    // crossSubDomainCookiesは本番環境でのみ有効化
    // localhostではブラウザの制限により正しく動作しない
    ...(process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_ROOT_DOMAIN
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`,
          },
        }
      : {}),
  },
});

export type Session = typeof auth.$Infer.Session;
