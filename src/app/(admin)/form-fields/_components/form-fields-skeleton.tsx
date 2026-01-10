import { Skeleton } from "@/components/ui/skeleton";

export function FormFieldsSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="divide-y">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
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
            {/* アクションボタン */}
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
