import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";

import { CsvFieldSettingsContent } from "./_components/csv-field-settings-content";
import { CsvFieldSettingsSkeleton } from "./_components/csv-field-settings-skeleton";

export default function CsvFieldSettingsPage() {
  return (
    <div>
      <PageHeader
        title="CSV出力設定"
        description="CSVエクスポート時の出力項目を設定します"
      />

      <Suspense fallback={<CsvFieldSettingsSkeleton />}>
        <CsvFieldSettingsContent />
      </Suspense>
    </div>
  );
}
