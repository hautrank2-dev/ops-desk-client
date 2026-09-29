"use client";

import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small line rendered above the title (e.g. a code or status pills) */
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  onBack?: () => void;
  className?: string;
};

export function PageHeader({ title, description, eyebrow, actions, onBack, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="mt-0.5 inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-card text-foreground/70 shadow-soft transition-all duration-200 ease-apple hover:text-foreground active:scale-95"
          >
            <ChevronLeft className="size-5 -translate-x-px" />
          </button>
        )}
        <div className="min-w-0 space-y-1">
          {eyebrow && <div className="flex flex-wrap items-center gap-2">{eyebrow}</div>}
          <h1 className="truncate text-[26px] leading-tight font-semibold tracking-[-0.025em] sm:text-[28px]">{title}</h1>
          {description && <p className="text-[15px] text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
