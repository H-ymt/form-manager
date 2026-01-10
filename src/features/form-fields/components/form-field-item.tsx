"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FormField } from "@/server/db/schema/form-fields";

interface FormFieldItemProps {
  field: FormField;
  onEdit: () => void;
  onDelete: () => void;
}

const fieldTypeLabels: Record<string, string> = {
  text: "テキスト",
  textarea: "テキストエリア",
  email: "メール",
  tel: "電話番号",
  date: "日付",
  select: "セレクト",
  radio: "ラジオ",
  checkbox: "チェックボックス",
};

export function FormFieldItem({ field, onEdit, onDelete }: FormFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 bg-card p-4"
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{field.label}</span>
          <Badge variant="secondary">
            {fieldTypeLabels[field.fieldType] || field.fieldType}
          </Badge>
          {field.isRequired && (
            <Badge variant="destructive" className="text-xs">
              必須
            </Badge>
          )}
          {!field.isActive && (
            <Badge variant="outline" className="text-xs">
              無効
            </Badge>
          )}
        </div>
        <div className="mt-1 text-muted-foreground text-sm">
          key: {field.fieldKey}
          {field.placeholder && ` / placeholder: ${field.placeholder}`}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
