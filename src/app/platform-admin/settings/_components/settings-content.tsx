"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function SettingsContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>一般設定</CardTitle>
          <CardDescription>
            プラットフォームの基本設定を構成します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="platform-name">プラットフォーム名</Label>
            <Input
              id="platform-name"
              placeholder="Form Manager"
              defaultValue="Form Manager"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="admin-email">管理者メールアドレス</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@example.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>セキュリティ設定</CardTitle>
          <CardDescription>
            セキュリティに関する設定を構成します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>新規登録を許可</Label>
              <p className="text-muted-foreground text-sm">
                新しいテナントの登録を許可します
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>二要素認証を必須にする</Label>
              <p className="text-muted-foreground text-sm">
                すべてのユーザーに二要素認証を必須にします
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>通知設定</CardTitle>
          <CardDescription>
            システム通知に関する設定を構成します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>メール通知</Label>
              <p className="text-muted-foreground text-sm">
                重要なイベントのメール通知を受け取ります
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        {/* TODO: 設定保存機能を実装する */}
        <Button disabled>設定を保存</Button>
      </div>
    </div>
  );
}
