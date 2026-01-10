"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EntryStatus = "unread" | "exported" | "deleted";

interface Entry {
  id: number;
  formData: Record<string, unknown>;
  isExported: boolean;
  deletedAt: Date | null;
  createdAt: Date;
}

async function fetchEntries(status: EntryStatus, page: number, perPage: number) {
  const res = await fetch(
    `/api/admin/entries?status=${status}&page=${page}&perPage=${perPage}`
  );
  if (!res.ok) throw new Error("Failed to fetch entries");
  return res.json();
}

async function bulkDeleteEntries(ids: number[]) {
  const res = await fetch("/api/admin/entries/bulk-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("Failed to delete entries");
}

async function bulkRestoreEntries(ids: number[]) {
  const res = await fetch("/api/admin/entries/bulk-restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("Failed to restore entries");
}

export default function EntriesPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<EntryStatus>("unread");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["entries", status, page, perPage],
    queryFn: () => fetchEntries(status, page, perPage),
  });

  const deleteMutation = useMutation({
    mutationFn: bulkDeleteEntries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      setSelectedIds([]);
      toast.success("削除しました");
    },
    onError: () => {
      toast.error("削除に失敗しました");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: bulkRestoreEntries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      setSelectedIds([]);
      toast.success("復元しました");
    },
    onError: () => {
      toast.error("復元に失敗しました");
    },
  });

  const entries: Entry[] = data?.data ?? [];
  const allSelected =
    entries.length > 0 && selectedIds.length === entries.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(entries.map((e) => e.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as EntryStatus);
    setPage(1);
    setSelectedIds([]);
  };

  return (
    <div>
      <PageHeader
        title="送信内容"
        description="フォームから送信された内容を管理します"
      />

      <Tabs value={status} onValueChange={handleStatusChange}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="unread">未出力</TabsTrigger>
            <TabsTrigger value="exported">出力済み</TabsTrigger>
            <TabsTrigger value="deleted">削除済み</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <>
                {status === "deleted" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restoreMutation.mutate(selectedIds)}
                    disabled={restoreMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    復元 ({selectedIds.length})
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(selectedIds)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    削除 ({selectedIds.length})
                  </Button>
                )}
              </>
            )}

            <Select
              value={String(perPage)}
              onValueChange={(v) => setPerPage(Number(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10件</SelectItem>
                <SelectItem value="25">25件</SelectItem>
                <SelectItem value="50">50件</SelectItem>
                <SelectItem value="100">100件</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={status} className="mt-0">
          <div className="bg-card rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>送信内容</TableHead>
                  <TableHead>送信日時</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      読み込み中...
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      データがありません
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(entry.id)}
                          onCheckedChange={() => toggleSelect(entry.id)}
                        />
                      </TableCell>
                      <TableCell>{entry.id}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {JSON.stringify(entry.formData)}
                      </TableCell>
                      <TableCell>
                        {new Date(entry.createdAt).toLocaleString("ja-JP")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data?.pagination && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                {data.pagination.total}件中{" "}
                {(page - 1) * perPage + 1}-
                {Math.min(page * perPage, data.pagination.total)}件を表示
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  前へ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * perPage >= data.pagination.total}
                >
                  次へ
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
