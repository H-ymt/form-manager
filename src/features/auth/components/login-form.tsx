"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signIn } from "@/server/auth/client";

const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn.email({
        email: data.email.trim(),
        password: data.password.trim(),
      });

      console.log("Login result:", result);

      if (result.error) {
        console.log("Login error:", result.error);
        setError(result.error.message || "ログインに失敗しました");
        setIsLoading(false);
        return;
      }

      // ログイン成功
      console.log("Login success, redirecting...");

      // サブドメインに応じてリダイレクト先を変更
      // admin.localhost → / (middlewareが /platform-admin にリライト)
      // tenant1.localhost → / (middlewareが /tenant にリライト)
      const hostname = window.location.hostname;
      const redirectUrl = hostname.startsWith("admin.")
        ? "/organizations" // middlewareが /platform-admin/organizations にリライト
        : "/entries"; // middlewareが /tenant/entries にリライト

      console.log("Redirect URL:", redirectUrl);
      // Cookieがセットされるのを待ってからリダイレクト
      await new Promise((resolve) => setTimeout(resolve, 100));
      window.location.href = redirectUrl;
    } catch (e) {
      console.error("Login exception:", e);
      setError("ログインに失敗しました");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">ログイン</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メールアドレス</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>パスワード</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "ログイン中..." : "ログイン"}
            </Button>

            <div className="text-center text-sm">
              <Link
                href="/forgot-password"
                className="text-primary hover:underline"
              >
                パスワードを忘れた方
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
