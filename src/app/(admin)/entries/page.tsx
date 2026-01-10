import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";

import { EntriesContent } from "./_components/entries-content";
import { EntriesSkeleton } from "./_components/entries-skeleton";

export default function EntriesPage() {
  return (
    <div>
      <PageHeader title="送信内容" description="フォームから送信された内容を管理します" />

      <Suspense fallback={<EntriesSkeleton />}>
        <EntriesContent />
      </Suspense>
    </div>
  );
}
