import { Skeleton } from "@/components/ui/skeleton";

export function CsvFieldSettingsSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b p-4">
          {/* ドラッグハンドル */}
          <Skeleton className="h-5 w-5" />
          {/* コンテンツ */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
          {/* スイッチ */}
          <Skeleton className="h-5 w-9 rounded-full" />
          {/* 削除ボタン */}
          <Skeleton className="h-9 w-9" />
        </div>
      ))}
    </div>
  );
}
