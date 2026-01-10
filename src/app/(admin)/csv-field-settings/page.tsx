"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { CsvFieldSetting } from "@/server/db/schema/csv-field-settings";

async function fetchCsvFieldSettings() {
  const res = await fetch("/api/admin/csv-field-settings");
  if (!res.ok) throw new Error("Failed to fetch CSV field settings");
  return res.json();
}

async function bulkUpdateSettings(settings: { id: number; sortOrder?: number; isActive?: boolean }[]) {
  const res = await fetch("/api/admin/csv-field-settings/bulk-update", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings }),
  });
  if (!res.ok) throw new Error("Failed to update settings");
}

async function deleteSetting(id: number) {
  const res = await fetch(`/api/admin/csv-field-settings/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete setting");
}

function CsvFieldSettingItem({
  setting,
  onToggle,
  onDelete,
}: {
  setting: CsvFieldSetting;
  onToggle: (id: number, isActive: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: setting.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4 p-4 bg-card  border-b">
      <button className="cursor-grab touch-none text-muted-foreground hover:text-foreground" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{setting.displayName}</span>
          <Badge variant={setting.fieldType === "fixed" ? "default" : "secondary"}>
            {setting.fieldType === "fixed" ? "固定値" : "カスタム"}
          </Badge>
        </div>
        {setting.fieldKey && <div className="text-sm text-muted-foreground">key: {setting.fieldKey}</div>}
        {setting.defaultValue && <div className="text-sm text-muted-foreground">デフォルト: {setting.defaultValue}</div>}
      </div>

      <Switch checked={setting.isActive} onCheckedChange={(checked) => onToggle(setting.id, checked)} />

      <Button variant="ghost" size="icon" onClick={() => onDelete(setting.id)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export default function CsvFieldSettingsPage() {
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data, isLoading } = useQuery({
    queryKey: ["csvFieldSettings"],
    queryFn: fetchCsvFieldSettings,
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: bulkUpdateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["csvFieldSettings"] });
    },
    onError: () => {
      toast.error("更新に失敗しました");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["csvFieldSettings"] });
      toast.success("削除しました");
    },
    onError: () => {
      toast.error("削除に失敗しました");
    },
  });

  const settings: CsvFieldSetting[] = data?.data ?? [];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = settings.findIndex((s) => s.id === active.id);
      const newIndex = settings.findIndex((s) => s.id === over.id);

      const newOrder = arrayMove(settings, oldIndex, newIndex);
      const updates = newOrder.map((setting, index) => ({
        id: setting.id,
        sortOrder: index,
      }));

      bulkUpdateMutation.mutate(updates);
    }
  };

  const handleToggle = (id: number, isActive: boolean) => {
    bulkUpdateMutation.mutate([{ id, isActive }]);
  };

  const handleDelete = (id: number) => {
    if (confirm("この設定を削除しますか？")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      <PageHeader title="CSV出力設定" description="CSVエクスポート時の出力項目を設定します" />

      {isLoading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : settings.length === 0 ? (
        <div className="text-center py-8 bg-card rounded-lg border">
          <p className="text-muted-foreground">設定がありません</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={settings.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {settings.map((setting) => (
                <CsvFieldSettingItem key={setting.id} setting={setting} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
