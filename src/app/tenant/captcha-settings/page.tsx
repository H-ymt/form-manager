import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";

import { CaptchaSettingsContent } from "./_components/captcha-settings-content";
import { CaptchaSettingsSkeleton } from "./_components/captcha-settings-skeleton";

export default function CaptchaSettingsPage() {
  return (
    <div>
      <PageHeader
        title="CAPTCHA設定"
        description="フォームのボット対策設定を管理します"
      />

      <Suspense fallback={<CaptchaSettingsSkeleton />}>
        <CaptchaSettingsContent />
      </Suspense>
    </div>
  );
}
