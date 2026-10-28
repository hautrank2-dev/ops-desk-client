"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type EntityOption<T = unknown> = {
  value: string;
  name: string;
  code?: string;
  data?: T;
};

export type EntityPage<T = unknown> = {
  items: EntityOption<T>[];
  hasNext: boolean;
};

export type FetchEntityPage<T = unknown> = (params: {
  search: string;
  page: number;
  pageSize: number;
}) => Promise<EntityPage<T>>;

export type EntitySelectProps<T = unknown> = {
  value: string;
  onChange: (value: string) => void;
  /** Cache key prefix — include every filter that changes the result set. */
  queryKey: readonly unknown[];
  fetchPage: FetchEntityPage<T>;
  /** Resolves the label of a preset value that is not in a loaded page yet. */
  fetchOne?: (id: string) => Promise<EntityOption<T> | null>;
  /** Already-known option for the current value (e.g. a populated field). */
  initialOption?: EntityOption<T> | null;
  renderOption?: (option: EntityOption<T>) => ReactNode;
  renderValue?: (option: EntityOption<T>) => ReactNode;
  placeholder?: ReactNode;
  searchPlaceholder?: string;
  emptyText?: string;
  clearable?: boolean;
  /** Label for the "no value" row; omit to hide it. */
  noneLabel?: string;
  pageSize?: number;
  className?: string;
};

const DEBOUNCE_MS = 300;

/** Generic server-backed select: debounced search, lazy + infinite loading, label cache. */
export function EntitySelect<T>({
  value,
  onChange,
  queryKey,
  fetchPage,
  fetchOne,
  initialOption,
  renderOption = (o) => o.name,
  renderValue,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results",
  clearable = true,
  noneLabel,
  pageSize = 20,
  className,
}: EntitySelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const labels = useRef(new Map<string, EntityOption<T>>());
  const sentinel = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  if (initialOption) labels.current.set(initialOption.value, initialOption);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  const list = useInfiniteQuery({
    queryKey: [...queryKey, "select", debounced],
    queryFn: ({ pageParam }) => fetchPage({ search: debounced, page: pageParam, pageSize }),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (last.hasNext ? all.length + 1 : undefined),
    enabled: open,
  });

  const options = list.data?.pages.flatMap((p) => p.items) ?? [];
  options.forEach((o) => labels.current.set(o.value, o));

  const resolved = useQuery({
    queryKey: [...queryKey, "one", value],
    queryFn: () => (fetchOne ? fetchOne(value) : null),
    enabled: !!value && !!fetchOne && !labels.current.has(value),
  });
  if (resolved.data) labels.current.set(resolved.data.value, resolved.data);

  const selected = value ? labels.current.get(value) : undefined;

  // Load the next page when the sentinel at the end of the list scrolls into view.
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = list;
  useEffect(() => {
    const el = sentinel.current;
    if (!open || !el || !hasNextPage) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [open, hasNextPage, isFetchingNextPage, fetchNextPage, options.length]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(""); }}>
      <PopoverTrigger
        className={cn(
          "flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] border border-input bg-card px-3 text-sm transition-colors hover:border-black/20 dark:bg-white/[0.04] dark:hover:border-white/20",
          className
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate text-start", !selected && "text-muted-foreground")}>
          {selected
            ? (renderValue ?? renderOption)(selected)
            : resolved.isFetching ? <Loader2 className="size-4 animate-spin" /> : placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {clearable && value && (
            <X
              className="size-3.5 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
            />
          )}
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </span>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        // Let the popup focus the search box once positioned — `autoFocus` fires
        // while it still sits at (0,0) and makes the page scroll to the top.
        initialFocus={searchInput}
        className="w-(--anchor-width) min-w-[280px] gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center gap-2 border-b border-border p-2">
          <Search className="ml-1 size-4 text-muted-foreground" />
          <input
            ref={searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1.5">
          {noneLabel && !debounced && (
            <OptionRow active={!value} onClick={() => pick("")}>
              <span className="text-sm text-muted-foreground">{noneLabel}</span>
            </OptionRow>
          )}
          {list.isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
          ) : options.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">{emptyText}</p>
          ) : (
            options.map((o) => (
              <OptionRow key={o.value} active={o.value === value} onClick={() => pick(o.value)}>
                {renderOption(o)}
              </OptionRow>
            ))
          )}
          <div ref={sentinel} className="h-px" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-2"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function OptionRow({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-start transition-colors hover:bg-accent"
    >
      <Check className={cn("size-3.5 shrink-0 text-primary", active ? "opacity-100" : "opacity-0")} />
      <div className="min-w-0 flex-1">{children}</div>
    </button>
  );
}
