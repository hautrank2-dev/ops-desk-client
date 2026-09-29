import * as React from "react"

import { cn } from "@/lib/utils"

// Apple system-color tints, tuned for legible text in both themes
const TONES = {
  gray: "bg-black/[0.05] text-[#515154] dark:bg-white/[0.08] dark:text-[#c7c7cc]",
  blue: "bg-[#0071e3]/10 text-[#0062c4] dark:bg-[#0a84ff]/15 dark:text-[#5eb0ff]",
  indigo: "bg-[#5856d6]/10 text-[#4644b8] dark:bg-[#5e5ce6]/20 dark:text-[#a9a7ff]",
  purple: "bg-[#af52de]/10 text-[#8a35b5] dark:bg-[#bf5af2]/20 dark:text-[#dca6f8]",
  green: "bg-[#34c759]/[0.14] text-[#1a7f35] dark:bg-[#30d158]/15 dark:text-[#5fe07e]",
  amber: "bg-[#ff9f0a]/[0.14] text-[#a35600] dark:bg-[#ff9f0a]/15 dark:text-[#ffb547]",
  red: "bg-[#ff3b30]/10 text-[#cc1a10] dark:bg-[#ff453a]/15 dark:text-[#ff7a72]",
  teal: "bg-[#30b0c7]/[0.14] text-[#0c7489] dark:bg-[#40c8e0]/15 dark:text-[#6fdcf0]",
} as const

export type Tone = keyof typeof TONES

type StatusPillProps = React.ComponentProps<"span"> & {
  tone?: Tone
  /** Show a leading status dot */
  dot?: boolean
}

function StatusPill({ tone = "gray", dot = false, className, children, ...props }: StatusPillProps) {
  return (
    <span
      data-slot="status-pill"
      className={cn(
        "inline-flex h-[22px] w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className
      )}
      {...props}
    >
      {dot && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export { StatusPill }
