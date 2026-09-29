import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-[10px] border border-input bg-card px-3 py-2.5 text-base leading-relaxed shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-[border-color,box-shadow,background-color] duration-200 ease-apple outline-none placeholder:text-muted-foreground/70 hover:border-black/20 dark:hover:border-white/20 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15 md:text-sm dark:bg-white/[0.04] dark:disabled:bg-white/[0.02] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
