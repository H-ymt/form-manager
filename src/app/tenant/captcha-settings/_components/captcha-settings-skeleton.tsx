import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CaptchaSettingsSkeleton() {
  return (
    <div>
      {/* タブリスト */}
      <div className="mb-4 flex gap-1">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>

      {/* カード */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* スイッチ付きフィールド */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-5 w-9 rounded-full" />
          </div>
          {/* 入力フィールド x2 */}
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          {/* ボタン */}
          <div className="flex justify-end">
            <Skeleton className="h-9 w-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
