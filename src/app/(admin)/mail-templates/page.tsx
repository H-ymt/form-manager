"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MailTemplate {
  id: number;
  type: "admin" | "user";
  isEnabled: boolean;
  subject: string;
}

async function fetchMailTemplates() {
  const res = await fetch("/api/admin/mail-templates");
  if (!res.ok) throw new Error("Failed to fetch mail templates");
  return res.json();
}

const templateLabels = {
  admin: "管理者通知メール",
  user: "自動返信メール",
};

export default function MailTemplatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["mailTemplates"],
    queryFn: fetchMailTemplates,
  });

  const templates: MailTemplate[] = data?.data ?? [];

  return (
    <div>
      <PageHeader title="メールテンプレート" description="フォーム送信時に送信されるメールのテンプレートを管理します" />

      {isLoading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(["admin", "user"] as const).map((type) => {
            const template = templates.find((t) => t.type === type);
            return (
              <Link key={type} href={`/mail-templates/${type}`}>
                <Card className=" transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{templateLabels[type]}</CardTitle>
                      {template && (
                        <Badge variant={template.isEnabled ? "default" : "secondary"} className="mt-1">
                          {template.isEnabled ? "有効" : "無効"}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{template?.subject || "未設定"}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
