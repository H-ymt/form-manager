"use client";

import { AlertCircle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            エラーが発生しました
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            データの取得中に問題が発生しました。もう一度お試しください。
          </p>
          <Button onClick={reset}>再試行</Button>
        </CardContent>
      </Card>
    </div>
  );
}
