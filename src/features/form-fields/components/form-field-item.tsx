"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

import type { FormField } from "@/server/db/schema/form-fields";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="">
      <button className="" {...attributes} {...listeners}>
        <GripVertical className="" />
      </button>

      <div className="">
        <div className="">
          <span className="font-medium">{field.label}</span>
          <Badge variant="secondary">{fieldTypeLabels[field.fieldType] || field.fieldType}</Badge>
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
        <div className="">
          key: {field.fieldKey}
          {field.placeholder && ` / placeholder: ${field.placeholder}`}
        </div>
      </div>

      <div className="">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="" />
        </Button>
      </div>
    </div>
  );
}
