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
    <div className="">
      <Card className="">
        <CardHeader>
          <CardTitle className="">
            <AlertCircle className="" />
            エラーが発生しました
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="">データの取得中に問題が発生しました。もう一度お試しください。</p>
          <Button onClick={reset}>再試行</Button>
        </CardContent>
      </Card>
    </div>
  );
}
