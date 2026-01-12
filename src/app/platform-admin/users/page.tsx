import { Suspense } from "react";
import { UsersContent } from "./_components/users-content";
import { UsersSkeleton } from "./_components/users-skeleton";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">ユーザー管理</h1>
          <p className="text-muted-foreground">
            プラットフォームに登録されているユーザーを管理します
          </p>
        </div>
      </div>

      <Suspense fallback={<UsersSkeleton />}>
        <UsersContent />
      </Suspense>
    </div>
  );
}
