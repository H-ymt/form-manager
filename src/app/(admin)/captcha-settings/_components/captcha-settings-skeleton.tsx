import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CaptchaSettingsSkeleton() {
  return (
    <div>
      {/* タブリスト */}
      <div className="">
        <Skeleton className="" />
        <Skeleton className="" />
      </div>

      {/* カード */}
      <Card>
        <CardHeader>
          <Skeleton className="" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* スイッチ付きフィールド */}
          <div className="">
            <div className="space-y-2">
              <Skeleton className="" />
              <Skeleton className="" />
            </div>
            <Skeleton className="" />
          </div>
          {/* 入力フィールド x2 */}
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="" />
              <Skeleton className="" />
            </div>
          ))}
          {/* ボタン */}
          <div className="">
            <Skeleton className="" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
