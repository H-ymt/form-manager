import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { AdminLayout } from "@/components/layout/admin-layout";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/query-client";
import { requireTenant } from "@/lib/tenant";
import { TenantProvider } from "@/lib/tenant-context";
import { auth } from "@/server/auth";

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // テナント情報を取得
  const organization = await requireTenant();
  if (!organization) {
    notFound();
  }

  // セッション確認
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // TODO: ユーザーがこの組織のメンバーかどうかを確認

  return (
    <QueryProvider>
      <TenantProvider organization={organization}>
        <AdminLayout user={session.user} organization={organization}>
          {children}
        </AdminLayout>
        <Toaster />
      </TenantProvider>
    </QueryProvider>
  );
}
