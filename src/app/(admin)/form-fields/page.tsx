"use client";

import { Plus } from "lucide-react";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

import { FormFieldsWrapper } from "./_components/form-fields-content";
import { FormFieldsSkeleton } from "./_components/form-fields-skeleton";

export default function FormFieldsPage() {
  return (
    <div>
      <PageHeader
        title="フォーム項目"
        description="フォームの入力項目を管理します"
        actions={<AddButton />}
      />

      <Suspense fallback={<FormFieldsSkeleton />}>
        <FormFieldsWrapper />
      </Suspense>
    </div>
  );
}

function AddButton() {
  return (
    <Button
      onClick={() => {
        // FormFieldsWrapper内のモーダルを開くため、カスタムイベントを発火
        window.dispatchEvent(new CustomEvent("openFormFieldModal"));
      }}
    >
      <Plus className="h-4 w-4" />
      項目を追加
    </Button>
  );
}
