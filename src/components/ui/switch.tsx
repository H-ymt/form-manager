"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root data-slot="switch" className={cn("", className)} {...props}>
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className={cn("")} />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
