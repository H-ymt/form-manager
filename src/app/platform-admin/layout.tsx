import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/query-client";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { PlatformAdminLayout } from "./_components/platform-admin-layout";

export default async function PlatformAdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // プラットフォーム管理者権限のチェック
  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id));

  if (!dbUser || dbUser.role !== "platform_admin") {
    redirect("/unauthorized");
  }

  return (
    <QueryProvider>
      <PlatformAdminLayout user={session.user}>{children}</PlatformAdminLayout>
      <Toaster />
    </QueryProvider>
  );
}
