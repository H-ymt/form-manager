"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormFieldEditModal } from "@/features/form-fields/components/form-field-edit-modal";
import { FormFieldItem } from "@/features/form-fields/components/form-field-item";
import type { FormField } from "@/server/db/schema/form-fields";
import { FormFieldsSkeleton } from "./form-fields-skeleton";

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

export function FormFieldsWrapper() {
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
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
    },
    [formFields, sortMutation],
  );

  const handleEdit = useCallback((field: FormField) => {
    setEditingField(field);
    setIsModalOpen(true);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingField(null);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: number) => {
      if (confirm("このフィールドを削除しますか？")) {
        deleteMutation.mutate(id);
      }
    },
    [deleteMutation],
  );

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditingField(null);
  }, []);

  // ヘッダーボタンからのイベントを受け取る
  useEffect(() => {
    const handleOpenModal = () => handleAdd();
    window.addEventListener("openFormFieldModal", handleOpenModal);
    return () =>
      window.removeEventListener("openFormFieldModal", handleOpenModal);
  }, [handleAdd]);

  if (isLoading) {
    return <FormFieldsSkeleton />;
  }

  return (
    <>
      {formFields.length === 0 ? (
        <div className="rounded-lg border bg-card py-8 text-center">
          <p className="mb-4 text-muted-foreground">フォーム項目がありません</p>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            最初の項目を追加
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={formFields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y">
                {formFields.map((field) => (
                  <FormFieldItem
                    key={field.id}
                    field={field}
                    onEdit={() => handleEdit(field)}
                    onDelete={() => handleDelete(field.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <FormFieldEditModal
        open={isModalOpen}
        onClose={handleModalClose}
        field={editingField}
        nextSortOrder={formFields.length}
      />
    </>
  );
}
