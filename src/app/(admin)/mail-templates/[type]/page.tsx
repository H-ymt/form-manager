"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";

const mailTemplateSchema = z.object({
  isEnabled: z.boolean(),
  subject: z.string().min(1, "件名を入力してください"),
  bodyHtml: z.string(),
  bodyText: z.string(),
  fromAddress: z.string().email().optional().or(z.literal("")),
  fromName: z.string().optional(),
  replyTo: z.string().email().optional().or(z.literal("")),
});

type MailTemplateFormValues = z.infer<typeof mailTemplateSchema>;

async function fetchMailTemplate(type: string) {
  const res = await fetch(`/api/admin/mail-templates/${type}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch mail template");
  return res.json();
}

async function updateMailTemplate(type: string, data: MailTemplateFormValues) {
  const res = await fetch(`/api/admin/mail-templates/${type}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update mail template");
  return res.json();
}

const templateLabels = {
  admin: "管理者通知メール",
  user: "自動返信メール",
};

export default function MailTemplateEditPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const type = params.type as "admin" | "user";

  const { data, isLoading } = useQuery({
    queryKey: ["mailTemplate", type],
    queryFn: () => fetchMailTemplate(type),
  });

  const form = useForm<MailTemplateFormValues>({
    resolver: zodResolver(mailTemplateSchema),
    values: {
      isEnabled: data?.data?.isEnabled ?? true,
      subject: data?.data?.subject ?? "",
      bodyHtml: data?.data?.bodyHtml ?? "",
      bodyText: data?.data?.bodyText ?? "",
      fromAddress: data?.data?.fromAddress ?? "",
      fromName: data?.data?.fromName ?? "",
      replyTo: data?.data?.replyTo ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: MailTemplateFormValues) => updateMailTemplate(type, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mailTemplates"] });
      queryClient.invalidateQueries({ queryKey: ["mailTemplate", type] });
      toast.success("保存しました");
    },
    onError: () => {
      toast.error("保存に失敗しました");
    },
  });

  const onSubmit = (data: MailTemplateFormValues) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <Link href="/mail-templates" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          戻る
        </Link>
      </div>

      <PageHeader title={templateLabels[type]} description="メールテンプレートを編集します" />

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="isEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>メール送信</FormLabel>
                      <FormDescription>このテンプレートのメール送信を有効にする</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>件名</FormLabel>
                    <FormControl>
                      <Input placeholder="お問い合わせを受け付けました" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fromAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>送信元メールアドレス</FormLabel>
                      <FormControl>
                        <Input placeholder="noreply@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fromName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>送信者名</FormLabel>
                      <FormControl>
                        <Input placeholder="お問い合わせ窓口" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="replyTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>返信先メールアドレス</FormLabel>
                    <FormControl>
                      <Input placeholder="support@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bodyText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>本文（テキスト）</FormLabel>
                    <FormControl>
                      <Textarea placeholder="お問い合わせありがとうございます。" rows={10} {...field} />
                    </FormControl>
                    <FormDescription>
                      変数: {"{{name}}"}, {"{{email}}"}, {"{{message}}"} など
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bodyHtml"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>本文（HTML）</FormLabel>
                    <FormControl>
                      <Textarea placeholder="<p>お問い合わせありがとうございます。</p>" rows={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "保存中..." : "保存"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
