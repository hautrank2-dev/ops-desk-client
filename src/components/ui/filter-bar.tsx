"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { ChevronDownIcon, CheckIcon } from "lucide-react";

// ── Label wrapper ─────────────────────────────────────────────────────────────
function FilterLabel({ label, children }: { label?: string; children: React.ReactNode }) {
  if (!label) return <>{children}</>;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground leading-none px-0.5 select-none">
        {label}
      </span>
      {children}
    </div>
  );
}

// ── Debounced text input ──────────────────────────────────────────────────────
type DebouncedInputProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  debounce?: number;
  className?: string;
  icon?: boolean;
};

export function DebouncedInput({
  value: externalValue,
  onChange,
  placeholder,
  label,
  debounce = 400,
  className,
  icon = false,
}: DebouncedInputProps) {
  const [local, setLocal] = useState(externalValue);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setLocal(externalValue); }, [externalValue]);

  const handle = (v: string) => {
    setLocal(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(v), debounce);
  };

  return (
    <FilterLabel label={label}>
      <div className={cn("relative", className)}>
        {icon && <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />}
        <Input
          value={local}
          onChange={(e) => handle(e.target.value)}
          placeholder={placeholder}
          className={cn("h-9 text-sm", icon && "pl-8.5")}
        />
      </div>
    </FilterLabel>
  );
}

// ── Generic filter select ─────────────────────────────────────────────────────
// Uses Base UI Select primitives directly to control exactly what's rendered
// in the trigger — showing placeholder when empty, label when selected.
type FilterSelectProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label?: string;
  options: { label: string; value: string }[];
  className?: string;
};

export function FilterSelect({ value, onChange, placeholder, label, options, className }: FilterSelectProps) {
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <FilterLabel label={label}>
      <SelectPrimitive.Root
        value={value || undefined}
        onValueChange={(v) => onChange(v ?? "")}
      >
        <SelectPrimitive.Trigger
          className={cn(
            "flex h-9 w-full cursor-pointer items-center justify-between gap-1.5 rounded-[10px] border border-input bg-card px-3 py-1 text-sm whitespace-nowrap shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-[border-color,box-shadow] duration-200 outline-none select-none hover:border-black/20 dark:hover:border-white/20",
            "focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-ring/15",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:bg-white/[0.04]",
            className
          )}
        >
          {/* Show placeholder or selected label — never the raw value */}
          <span className={cn("flex-1 text-left truncate", !value && "text-muted-foreground")}>
            {selectedLabel ?? placeholder}
          </span>
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground shrink-0" />
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner side="bottom" sideOffset={4} className="isolate z-50">
            <SelectPrimitive.Popup className="relative isolate z-50 max-h-60 w-(--anchor-width) min-w-36 overflow-y-auto rounded-xl bg-popover/95 text-popover-foreground shadow-float backdrop-blur-xl backdrop-saturate-150 p-1.5 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
              <SelectPrimitive.List>
                {/* "All" option */}
                <SelectPrimitive.Item
                  value=""
                  className="relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                >
                  <SelectPrimitive.ItemText className="flex flex-1 text-muted-foreground">
                    {placeholder}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                    <CheckIcon className="size-3.5 text-primary" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>

                {options.map((o) => (
                  <SelectPrimitive.Item
                    key={o.value}
                    value={o.value}
                    className="relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                  >
                    <SelectPrimitive.ItemText className="flex flex-1">
                      {o.label}
                    </SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                      <CheckIcon className="size-3.5 text-primary" />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.List>
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </FilterLabel>
  );
}

// ── Clear-all button ──────────────────────────────────────────────────────────
type FilterBarProps = {
  children: React.ReactNode;
  onClear?: () => void;
  hasFilters?: boolean;
};

export function FilterBar({ children, onClear, hasFilters }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-2.5">
      {children}
      {hasFilters && onClear && (
        <Button variant="ghost" size="sm" className="h-9 text-[13px] text-muted-foreground self-end" onClick={onClear}>
          <X className="h-3 w-3 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}
