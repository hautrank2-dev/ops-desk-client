"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { AssetModel, TableResponse } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  value: string;          // assetId
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
};

export function AssetCombobox({ value, onChange, placeholder = "Filter by asset…", className }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // debounce search
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedSearch(search), 350);
  }, [search]);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data, isFetching } = useQuery<AssetModel[]>({
    queryKey: ["assets-search", debouncedSearch],
    queryFn: async () => {
      const { data } = await httpClient.get<TableResponse<AssetModel> | AssetModel[]>("/asset", {
        params: { pageSize: 20, ...(debouncedSearch ? { code: debouncedSearch } : {}) },
      });
      return Array.isArray(data) ? data : data.items;
    },
    enabled: open,
  });

  const assets = data ?? [];
  const selected = value ? assets.find((a) => a._id === value) : null;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 w-full cursor-pointer items-center justify-between rounded-[10px] border border-input bg-card px-3 text-sm shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-colors hover:border-black/20 dark:bg-white/[0.04] dark:hover:border-white/20",
          !selected && "text-muted-foreground"
        )}
      >
        <span className="truncate">{selected ? `${selected.code} — ${selected.name}` : placeholder}</span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && (
            <X
              className="h-3 w-3 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); onChange(""); setSearch(""); }}
            />
          )}
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[260px] overflow-hidden rounded-xl bg-popover/95 shadow-float backdrop-blur-xl backdrop-saturate-150">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or name…"
              className="w-full rounded-md bg-muted/70 text-sm outline-none placeholder:text-muted-foreground px-2.5 py-1.5"
            />
          </div>
          <div className="max-h-52 overflow-y-auto p-1.5">
            {isFetching ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : assets.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-4">No assets found</p>
            ) : (
              assets.map((a) => (
                <button
                  key={a._id}
                  type="button"
                  onClick={() => { onChange(a._id); setOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent cursor-pointer"
                >
                  <Check className={cn("h-3.5 w-3.5 shrink-0 text-primary", value === a._id ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col items-start text-start">
                    <span className="font-mono text-xs text-muted-foreground">{a.code}</span>
                    <span>{a.name}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
