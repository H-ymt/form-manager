import { Suspense } from "react";
import { SettingsContent } from "./_components/settings-content";
import { SettingsSkeleton } from "./_components/settings-skeleton";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">設定</h1>
          <p className="text-muted-foreground">
            プラットフォーム全体の設定を管理します
          </p>
        </div>
      </div>

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
