import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/query-client";
import { auth } from "@/server/auth";
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

  // TODO: プラットフォーム管理者権限のチェック

  return (
    <QueryProvider>
      <PlatformAdminLayout user={session.user}>{children}</PlatformAdminLayout>
      <Toaster />
    </QueryProvider>
  );
}
