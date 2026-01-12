import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";

import { MailTemplatesContent } from "./_components/mail-templates-content";
import { MailTemplatesSkeleton } from "./_components/mail-templates-skeleton";

export default function MailTemplatesPage() {
  return (
    <div>
      <PageHeader
        title="メールテンプレート"
        description="フォーム送信時に送信されるメールのテンプレートを管理します"
      />

      <Suspense fallback={<MailTemplatesSkeleton />}>
        <MailTemplatesContent />
      </Suspense>
    </div>
  );
}
