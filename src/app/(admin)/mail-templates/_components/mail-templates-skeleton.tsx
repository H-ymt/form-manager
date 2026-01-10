import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MailTemplatesSkeleton() {
  return (
    <div className="">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="">
            <Skeleton className="" />
            <div className="">
              <Skeleton className="" />
              <Skeleton className="" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
