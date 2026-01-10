"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const recaptchaSchema = z.object({
  siteKey: z.string().min(1, "サイトキーを入力してください"),
  secretKey: z.string().min(1, "シークレットキーを入力してください"),
  threshold: z.number().min(0).max(1),
  isEnabled: z.boolean(),
});

const turnstileSchema = z.object({
  siteKey: z.string().min(1, "サイトキーを入力してください"),
  secretKey: z.string().min(1, "シークレットキーを入力してください"),
  isEnabled: z.boolean(),
});

type RecaptchaFormValues = z.infer<typeof recaptchaSchema>;
type TurnstileFormValues = z.infer<typeof turnstileSchema>;

async function fetchCaptchaSettings() {
  const res = await fetch("/api/admin/captcha-settings");
  if (!res.ok) throw new Error("Failed to fetch CAPTCHA settings");
  return res.json();
}

async function updateRecaptcha(data: RecaptchaFormValues) {
  const res = await fetch("/api/admin/captcha-settings/recaptcha", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update reCAPTCHA settings");
  return res.json();
}

async function updateTurnstile(data: TurnstileFormValues) {
  const res = await fetch("/api/admin/captcha-settings/turnstile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update Turnstile settings");
  return res.json();
}

function RecaptchaForm({ data }: { data: RecaptchaFormValues | null }) {
  const queryClient = useQueryClient();

  const form = useForm<RecaptchaFormValues>({
    resolver: zodResolver(recaptchaSchema),
    values: {
      siteKey: data?.siteKey ?? "",
      secretKey: data?.secretKey ?? "",
      threshold: data?.threshold ?? 0.5,
      isEnabled: data?.isEnabled ?? false,
    },
  });

  const mutation = useMutation({
    mutationFn: updateRecaptcha,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["captchaSettings"] });
      toast.success("保存しました");
    },
    onError: () => {
      toast.error("保存に失敗しました");
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <FormField
          control={form.control}
          name="isEnabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <FormLabel>reCAPTCHA v3 を有効にする</FormLabel>
                <FormDescription>
                  Google reCAPTCHA v3 を使用してボット対策を行います
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="siteKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>サイトキー</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="secretKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>シークレットキー</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="threshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>スコアしきい値</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                0.0〜1.0の値。高いほど厳格（推奨: 0.5）
              </FormDescription>
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
  );
}

function TurnstileForm({ data }: { data: TurnstileFormValues | null }) {
  const queryClient = useQueryClient();

  const form = useForm<TurnstileFormValues>({
    resolver: zodResolver(turnstileSchema),
    values: {
      siteKey: data?.siteKey ?? "",
      secretKey: data?.secretKey ?? "",
      isEnabled: data?.isEnabled ?? false,
    },
  });

  const mutation = useMutation({
    mutationFn: updateTurnstile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["captchaSettings"] });
      toast.success("保存しました");
    },
    onError: () => {
      toast.error("保存に失敗しました");
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <FormField
          control={form.control}
          name="isEnabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <FormLabel>Cloudflare Turnstile を有効にする</FormLabel>
                <FormDescription>
                  Cloudflare Turnstile を使用してボット対策を行います
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="siteKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>サイトキー</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="secretKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>シークレットキー</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
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
  );
}

export default function CaptchaSettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["captchaSettings"],
    queryFn: fetchCaptchaSettings,
  });

  if (isLoading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div>
      <PageHeader
        title="CAPTCHA設定"
        description="フォームのボット対策設定を管理します"
      />

      <Tabs defaultValue="turnstile">
        <TabsList className="mb-4">
          <TabsTrigger value="turnstile">Cloudflare Turnstile</TabsTrigger>
          <TabsTrigger value="recaptcha">reCAPTCHA v3</TabsTrigger>
        </TabsList>

        <TabsContent value="turnstile">
          <Card>
            <CardHeader>
              <CardTitle>Cloudflare Turnstile</CardTitle>
            </CardHeader>
            <CardContent>
              <TurnstileForm data={data?.data?.turnstile ?? null} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recaptcha">
          <Card>
            <CardHeader>
              <CardTitle>Google reCAPTCHA v3</CardTitle>
            </CardHeader>
            <CardContent>
              <RecaptchaForm data={data?.data?.recaptcha ?? null} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
