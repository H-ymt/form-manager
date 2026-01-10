"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormField as FormFieldType } from "@/server/db/schema/form-fields";

const formFieldSchema = z.object({
  fieldKey: z.string().min(1, "キーを入力してください"),
  fieldType: z.enum([
    "text",
    "textarea",
    "email",
    "tel",
    "date",
    "select",
    "radio",
    "checkbox",
  ]),
  label: z.string().min(1, "ラベルを入力してください"),
  placeholder: z.string().optional(),
  isRequired: z.boolean(),
  isActive: z.boolean(),
  options: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});

type FormFieldFormValues = z.infer<typeof formFieldSchema>;

interface FormFieldEditModalProps {
  open: boolean;
  onClose: () => void;
  field: FormFieldType | null;
  nextSortOrder: number;
}

async function createFormField(
  data: FormFieldFormValues & { sortOrder: number }
) {
  const res = await fetch("/api/admin/form-fields", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create form field");
  return res.json();
}

async function updateFormField(
  id: number,
  data: Partial<FormFieldFormValues>
) {
  const res = await fetch(`/api/admin/form-fields/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update form field");
  return res.json();
}

const fieldTypes = [
  { value: "text", label: "テキスト" },
  { value: "textarea", label: "テキストエリア" },
  { value: "email", label: "メール" },
  { value: "tel", label: "電話番号" },
  { value: "date", label: "日付" },
  { value: "select", label: "セレクト" },
  { value: "radio", label: "ラジオ" },
  { value: "checkbox", label: "チェックボックス" },
];

export function FormFieldEditModal({
  open,
  onClose,
  field,
  nextSortOrder,
}: FormFieldEditModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!field;

  const form = useForm<FormFieldFormValues>({
    resolver: zodResolver(formFieldSchema),
    defaultValues: {
      fieldKey: "",
      fieldType: "text",
      label: "",
      placeholder: "",
      isRequired: false,
      isActive: true,
      options: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const fieldType = form.watch("fieldType");
  const needsOptions = ["select", "radio", "checkbox"].includes(fieldType);

  useEffect(() => {
    if (field) {
      form.reset({
        fieldKey: field.fieldKey,
        fieldType: field.fieldType,
        label: field.label,
        placeholder: field.placeholder || "",
        isRequired: field.isRequired,
        isActive: field.isActive,
        options: field.options || [],
      });
    } else {
      form.reset({
        fieldKey: "",
        fieldType: "text",
        label: "",
        placeholder: "",
        isRequired: false,
        isActive: true,
        options: [],
      });
    }
  }, [field, form]);

  const createMutation = useMutation({
    mutationFn: createFormField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formFields"] });
      toast.success("作成しました");
      onClose();
    },
    onError: () => {
      toast.error("作成に失敗しました");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormFieldFormValues> }) =>
      updateFormField(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formFields"] });
      toast.success("更新しました");
      onClose();
    },
    onError: () => {
      toast.error("更新に失敗しました");
    },
  });

  const onSubmit = (data: FormFieldFormValues) => {
    if (isEditing && field) {
      updateMutation.mutate({ id: field.id, data });
    } else {
      createMutation.mutate({ ...data, sortOrder: nextSortOrder });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "フォーム項目を編集" : "フォーム項目を追加"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ラベル</FormLabel>
                  <FormControl>
                    <Input placeholder="お名前" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fieldKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>キー</FormLabel>
                  <FormControl>
                    <Input placeholder="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fieldType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>種類</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fieldTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="placeholder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>プレースホルダー</FormLabel>
                  <FormControl>
                    <Input placeholder="例：山田太郎" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {needsOptions && (
              <div className="space-y-2">
                <FormLabel>選択肢</FormLabel>
                {fields.map((option, index) => (
                  <div key={option.id} className="flex gap-2">
                    <Input
                      placeholder="値"
                      {...form.register(`options.${index}.value`)}
                    />
                    <Input
                      placeholder="ラベル"
                      {...form.register(`options.${index}.label`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ value: "", label: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  選択肢を追加
                </Button>
              </div>
            )}

            <div className="flex items-center gap-6">
              <FormField
                control={form.control}
                name="isRequired"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">必須</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">有効</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "保存中..." : "保存"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
