import { Suspense } from "react";
import { OrganizationsContent } from "./_components/organizations-content";
import { OrganizationsSkeleton } from "./_components/organizations-skeleton";

export default function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">テナント管理</h1>
          <p className="text-muted-foreground">
            プラットフォームに登録されているテナント（組織）を管理します
          </p>
        </div>
      </div>

      <Suspense fallback={<OrganizationsSkeleton />}>
        <OrganizationsContent />
      </Suspense>
    </div>
  );
}
