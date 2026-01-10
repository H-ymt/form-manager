"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { FormFieldItem } from "@/features/form-fields/components/form-field-item";
import { FormFieldEditModal } from "@/features/form-fields/components/form-field-edit-modal";
import type { FormField } from "@/server/db/schema/form-fields";

async function fetchFormFields() {
  const res = await fetch("/api/admin/form-fields");
  if (!res.ok) throw new Error("Failed to fetch form fields");
  return res.json();
}

async function updateSortOrder(fields: { id: number; sortOrder: number }[]) {
  const res = await fetch("/api/admin/form-fields/bulk-update-order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error("Failed to update sort order");
}

async function deleteFormField(id: number) {
  const res = await fetch(`/api/admin/form-fields/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete form field");
}

export default function FormFieldsPage() {
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data, isLoading } = useQuery({
    queryKey: ["formFields"],
    queryFn: fetchFormFields,
  });

  const sortMutation = useMutation({
    mutationFn: updateSortOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formFields"] });
    },
    onError: () => {
      toast.error("並び替えの保存に失敗しました");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFormField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formFields"] });
      toast.success("削除しました");
    },
    onError: () => {
      toast.error("削除に失敗しました");
    },
  });

  const formFields: FormField[] = data?.data ?? [];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = formFields.findIndex((f) => f.id === active.id);
      const newIndex = formFields.findIndex((f) => f.id === over.id);

      const newOrder = arrayMove(formFields, oldIndex, newIndex);
      const updates = newOrder.map((field, index) => ({
        id: field.id,
        sortOrder: index,
      }));

      sortMutation.mutate(updates);
    }
  };

  const handleEdit = (field: FormField) => {
    setEditingField(field);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingField(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("このフィールドを削除しますか？")) {
      deleteMutation.mutate(id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingField(null);
  };

  return (
    <div>
      <PageHeader
        title="フォーム項目"
        description="フォームの入力項目を管理します"
        actions={
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            項目を追加
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : formFields.length === 0 ? (
        <div className="text-center py-8 bg-card rounded-lg border">
          <p className="text-muted-foreground mb-4">フォーム項目がありません</p>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            最初の項目を追加
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-lg border overflow-hidden">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={formFields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="divide-y">
                {formFields.map((field) => (
                  <FormFieldItem key={field.id} field={field} onEdit={() => handleEdit(field)} onDelete={() => handleDelete(field.id)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <FormFieldEditModal open={isModalOpen} onClose={handleModalClose} field={editingField} nextSortOrder={formFields.length} />
    </div>
  );
}
