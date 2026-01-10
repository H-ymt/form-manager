import { Skeleton } from "@/components/ui/skeleton";

export function CsvFieldSettingsSkeleton() {
  return (
    <div className="">
      {[...Array(6)].map((_, i) => (
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
          {/* スイッチ */}
          <Skeleton className="" />
          {/* 削除ボタン */}
          <Skeleton className="" />
        </div>
      ))}
    </div>
  );
}
