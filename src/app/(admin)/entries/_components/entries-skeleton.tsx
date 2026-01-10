import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function EntriesSkeleton() {
  return (
    <div>
      {/* タブ + アクション */}
      <div className="">
        <div className="">
          <Skeleton className="" />
          <Skeleton className="" />
          <Skeleton className="" />
        </div>
        <Skeleton className="" />
      </div>

      {/* テーブル */}
      <div className="">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Skeleton className="" />
              </TableHead>
              <TableHead>
                <Skeleton className="" />
              </TableHead>
              <TableHead>
                <Skeleton className="" />
              </TableHead>
              <TableHead>
                <Skeleton className="" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(10)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="" />
                </TableCell>
                <TableCell>
                  <Skeleton className="" />
                </TableCell>
                <TableCell>
                  <Skeleton className="" />
                </TableCell>
                <TableCell>
                  <Skeleton className="" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      <div className="">
        <Skeleton className="" />
        <div className="">
          <Skeleton className="" />
          <Skeleton className="" />
        </div>
      </div>
    </div>
  );
}
