import { Suspense } from "react";

import { FormDisplay } from "./_components/form-display";
import { FormSkeleton } from "./_components/form-skeleton";

export default function FormPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <Suspense fallback={<FormSkeleton />}>
        <FormDisplay />
      </Suspense>
    </div>
  );
}
