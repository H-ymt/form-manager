import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { requireTenant } from "@/lib/tenant";
import { getMailTemplates } from "@/server/db/queries";

import { MailTemplatesContent } from "./_components/mail-templates-content";
import { MailTemplatesSkeleton } from "./_components/mail-templates-skeleton";

async function MailTemplatesData() {
  const organization = await requireTenant();
  if (!organization) {
    return null;
  }

  const templates = await getMailTemplates(organization.id);
  return <MailTemplatesContent templates={templates} />;
}

export default function MailTemplatesPage() {
  return (
    <div>
      <PageHeader
        title="メールテンプレート"
        description="フォーム送信時に送信されるメールのテンプレートを管理します"
      />

      <Suspense fallback={<MailTemplatesSkeleton />}>
        <MailTemplatesData />
      </Suspense>
    </div>
  );
}
