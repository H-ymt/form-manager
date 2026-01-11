"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // サブドメインでも同一オリジンでAPIを呼ぶため、相対パスを使用
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
