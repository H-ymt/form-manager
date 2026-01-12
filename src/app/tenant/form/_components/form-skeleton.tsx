import { Skeleton } from "@/components/ui/skeleton";

export function FormSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}
