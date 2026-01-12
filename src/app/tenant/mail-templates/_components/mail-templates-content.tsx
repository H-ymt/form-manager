import { Mail } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MailTemplate } from "@/server/db/schema/mail-templates";

interface MailTemplatesContentProps {
  templates: MailTemplate[];
}

const templateLabels = {
  admin: "管理者通知メール",
  user: "自動返信メール",
};

export function MailTemplatesContent({ templates }: MailTemplatesContentProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(["admin", "user"] as const).map((type) => {
        const template = templates.find((t) => t.type === type);
        return (
          <Link key={type} href={`/mail-templates/${type}`}>
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {templateLabels[type]}
                  </CardTitle>
                  {template && (
                    <Badge
                      variant={template.isEnabled ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {template.isEnabled ? "有効" : "無効"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {template?.subject || "未設定"}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
