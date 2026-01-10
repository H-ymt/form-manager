import { Skeleton } from "@/components/ui/skeleton";

export function FormFieldsSkeleton() {
  return (
    <div className="">
      <div className="divide-y">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="">
            {/* ドラッグハンドル */}
            <Skeleton className="" />
            {/* コンテンツ */}
            <div className="">
              <div className="">
                <Skeleton className="" />
                <Skeleton className="" />
              </div>
              <Skeleton className="" />
            </div>
            {/* アクションボタン */}
            <div className="">
              <Skeleton className="" />
              <Skeleton className="" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
