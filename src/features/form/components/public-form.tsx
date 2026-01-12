"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CaptchaWidget } from "./captcha-widget";
import { PublicFormFields } from "./form-input";

async function fetchFormData() {
  const res = await fetch("/api/public/form-fields");
  if (!res.ok) throw new Error("Failed to fetch form data");
  return res.json();
}

async function submitForm(data: {
  captchaToken?: string;
  formData: Record<string, unknown>;
}) {
  const res = await fetch("/api/public/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit form");
  return res.json();
}

export function PublicForm() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-form-fields"],
    queryFn: fetchFormData,
  });
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (isLoading) return null;
  if (!data) return <div>フォームが見つかりません</div>;

  const { fields, organization } = data.data;

  const handleSubmit = async (captchaToken?: string) => {
    setIsSubmitting(true);
    try {
      await submitForm({ captchaToken, formData });
      setIsSubmitted(true);
      toast.success("フォームを送信しました");
    } catch (error) {
      toast.error("送信に失敗しました");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="py-10 text-center">
        <h1 className="mb-4 font-bold text-2xl">送信完了</h1>
        <p className="text-muted-foreground">ご入力ありがとうございました。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 font-bold text-3xl">{organization.name}</h1>
      <p className="mb-8 text-muted-foreground">お問い合わせフォーム</p>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <PublicFormFields
          fields={fields}
          value={formData}
          onChange={setFormData}
        />
        <CaptchaWidget onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </form>
    </div>
  );
}
