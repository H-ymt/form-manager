"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDown,
  Circle,
  Mail,
  Phone,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  data: FormFieldFormValues & { sortOrder: number },
) {
  const res = await fetch("/api/admin/form-fields", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create form field");
  return res.json();
}

async function updateFormField(id: number, data: Partial<FormFieldFormValues>) {
  const res = await fetch(`/api/admin/form-fields/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update form field");
  return res.json();
}

const fieldTypes = [
  { value: "text", label: "テキスト", icon: Type },
  { value: "textarea", label: "テキストエリア", icon: AlignLeft },
  { value: "email", label: "メール", icon: Mail },
  { value: "tel", label: "電話番号", icon: Phone },
  { value: "date", label: "日付", icon: Calendar },
  { value: "select", label: "セレクト", icon: ChevronDown },
  { value: "radio", label: "ラジオ", icon: Circle },
  { value: "checkbox", label: "チェックボックス", icon: CheckSquare },
];

// プレビューコンポーネント
function FormFieldPreview({
  label,
  fieldType,
  placeholder,
  isRequired,
  options,
}: {
  label: string;
  fieldType: string;
  placeholder: string;
  isRequired: boolean;
  options: { value: string; label: string }[];
}) {
  const displayLabel = label || "ラベル未入力";
  const displayPlaceholder = placeholder || "入力してください";

  const renderField = () => {
    switch (fieldType) {
      case "textarea":
        return (
          <Textarea
            placeholder={displayPlaceholder}
            className="resize-none bg-white"
            rows={3}
            disabled
          />
        );
      case "select":
        return (
          <Select disabled>
            <SelectTrigger className="bg-white">
              <SelectValue
                placeholder={
                  options.length > 0 ? options[0].label : "選択してください"
                }
              />
            </SelectTrigger>
          </Select>
        );
      case "radio":
        return (
          <RadioGroup disabled className="space-y-2">
            {options.length > 0 ? (
              options.map((option, idx) => (
                <div
                  key={option.value || `radio-${idx}`}
                  className="flex items-center space-x-2"
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`preview-radio-${idx}`}
                  />
                  <Label
                    htmlFor={`preview-radio-${idx}`}
                    className="font-normal"
                  >
                    {option.label || "選択肢"}
                  </Label>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="preview-radio-1" />
                  <Label htmlFor="preview-radio-1" className="font-normal">
                    選択肢1
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="preview-radio-2" />
                  <Label htmlFor="preview-radio-2" className="font-normal">
                    選択肢2
                  </Label>
                </div>
              </>
            )}
          </RadioGroup>
        );
      case "checkbox":
        return (
          <div className="space-y-2">
            {options.length > 0 ? (
              options.map((option, idx) => (
                <div
                  key={option.value || `checkbox-${idx}`}
                  className="flex items-center space-x-2"
                >
                  <Checkbox id={`preview-checkbox-${idx}`} disabled />
                  <Label
                    htmlFor={`preview-checkbox-${idx}`}
                    className="font-normal"
                  >
                    {option.label || "選択肢"}
                  </Label>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox id="preview-checkbox-1" disabled />
                  <Label htmlFor="preview-checkbox-1" className="font-normal">
                    選択肢1
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="preview-checkbox-2" disabled />
                  <Label htmlFor="preview-checkbox-2" className="font-normal">
                    選択肢2
                  </Label>
                </div>
              </>
            )}
          </div>
        );
      case "date":
        return <Input type="date" className="bg-white" disabled />;
      case "email":
        return (
          <Input
            type="email"
            placeholder={displayPlaceholder}
            className="bg-white"
            disabled
          />
        );
      case "tel":
        return (
          <Input
            type="tel"
            placeholder={displayPlaceholder}
            className="bg-white"
            disabled
          />
        );
      default:
        return (
          <Input
            type="text"
            placeholder={displayPlaceholder}
            className="bg-white"
            disabled
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label className="font-medium text-sm">
        {displayLabel}
        {isRequired && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {renderField()}
    </div>
  );
}

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

  // プレビュー用に全てのフィールドを監視
  const watchedValues = form.watch();
  const fieldType = watchedValues.fieldType;
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
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<FormFieldFormValues>;
    }) => updateFormField(id, data),
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

  // フィールドタイプのアイコンを取得
  const getFieldTypeIcon = (value: string) => {
    const type = fieldTypes.find((t) => t.value === value);
    return type?.icon;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <div className="grid lg:grid-cols-[1fr_380px]">
          {/* 左側: 編集フォーム */}
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle>
                {isEditing ? "フィールドを編集" : "フィールドを追加"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* セクション1: 基本設定 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-xs">
                      1
                    </span>
                    <h3 className="font-medium">基本設定</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          ラベル <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="例: 趣味・特技、業界経験年数"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          フォームに表示される項目の名前です
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fieldKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            フィールドキー{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="例: hobby" {...field} />
                          </FormControl>
                          <FormDescription>
                            システム識別用のユニークID
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fieldType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>タイプ</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                {(() => {
                                  const Icon = getFieldTypeIcon(field.value);
                                  const type = fieldTypes.find(
                                    (t) => t.value === field.value,
                                  );
                                  return (
                                    <span className="flex items-center gap-2">
                                      {Icon && <Icon className="h-4 w-4" />}
                                      {type?.label}
                                    </span>
                                  );
                                })()}
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {fieldTypes.map((type) => {
                                const Icon = type.icon;
                                return (
                                  <SelectItem
                                    key={type.value}
                                    value={type.value}
                                  >
                                    <span className="flex items-center gap-2">
                                      <Icon className="h-4 w-4" />
                                      {type.label}
                                    </span>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            入力形式を選択してください
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="placeholder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>プレースホルダー</FormLabel>
                        <FormControl>
                          <Input placeholder="例：山田太郎" {...field} />
                        </FormControl>
                        <FormDescription>
                          入力欄に表示されるヒントテキスト
                        </FormDescription>
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
                        <Plus className="mr-2 h-4 w-4" />
                        選択肢を追加
                      </Button>
                    </div>
                  )}
                </div>

                {/* セクション2: その他の設定 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-xs">
                      2
                    </span>
                    <h3 className="font-medium">その他の設定</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="isRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>必須項目にする</FormLabel>
                            <FormDescription>
                              ユーザーに入力を強制します
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>有効にする</FormLabel>
                            <FormDescription>
                              フォームに表示されます
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "保存中..." : "保存"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* 右側: プレビュー */}
          <div className="bg-muted/30 px-6 pt-10 pb-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-muted-foreground">プレビュー</h3>
              <div className="flex gap-1">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </div>
            </div>

            {/* ブラウザ風プレビュー */}
            <div className="rounded-lg border bg-background shadow-sm">
              <div className="p-6">
                <FormFieldPreview
                  label={watchedValues.label}
                  fieldType={watchedValues.fieldType}
                  placeholder={watchedValues.placeholder || ""}
                  isRequired={watchedValues.isRequired}
                  options={watchedValues.options || []}
                />

                <Button className="mt-6 w-full" disabled>
                  送信
                </Button>
              </div>
            </div>

            <p className="mt-4 text-center text-muted-foreground text-xs">
              ※ 実際の表示はデザインテーマにより異なる場合があります
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
