import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminLayout } from "@/components/layout/admin-layout";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/query-client";
import { auth } from "@/server/auth";

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <QueryProvider>
      <AdminLayout user={session.user}>{children}</AdminLayout>
      <Toaster />
    </QueryProvider>
  );
}
