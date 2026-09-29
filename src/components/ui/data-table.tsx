import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, Search, ChevronLeft, ChevronRight, Inbox, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  // server-side pagination
  page?: number
  pageSize?: number
  total?: number
  totalPage?: number
  onPageChange?: (page: number) => void
  onSearch?: (value: string) => void
  onRowClick?: (row: TData) => void
  // row selection
  enableRowSelection?: boolean
  onSelectionChange?: (rows: TData[]) => void
  getRowId?: (row: TData) => string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Filter...",
  page,
  totalPage,
  total,
  onPageChange,
  onSearch,
  onRowClick,
  enableRowSelection,
  onSelectionChange,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const isServerPagination = onPageChange !== undefined
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [searchValue, setSearchValue] = React.useState("")

  // prepend checkbox column when selection is enabled
  const allColumns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!enableRowSelection) return columns
    const checkboxCol: ColumnDef<TData, TValue> = {
      id: "__select__",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }
    return [checkboxCol, ...columns]
  }, [columns, enableRowSelection])

  const table = useReactTable({
    data,
    columns: allColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      setRowSelection((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater
        onSelectionChange?.(
          table.getRowModel().rows
            .filter((r) => next[r.id])
            .map((r) => r.original)
        )
        return next
      })
    },
    enableRowSelection: !!enableRowSelection,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    manualPagination: isServerPagination,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  })

  const currentPage = page ?? 1
  const pages = totalPage ?? 1

  const handleSearch = (value: string) => {
    setSearchValue(value)
    if (onSearch) {
      onSearch(value)
    } else if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(value)
    }
  }

  const getPageNumbers = () => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
    const delta = 2
    const range: (number | "...")[] = []
    const left = Math.max(2, currentPage - delta)
    const right = Math.min(pages - 1, currentPage + delta)
    range.push(1)
    if (left > 2) range.push("...")
    for (let i = left; i <= right; i++) range.push(i)
    if (right < pages - 1) range.push("...")
    range.push(pages)
    return range
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3">
        {(searchKey || onSearch) && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-input bg-card px-3 h-9 text-sm font-medium text-foreground/80 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-colors hover:bg-muted hover:text-foreground aria-expanded:bg-muted dark:bg-white/[0.04] dark:hover:bg-white/[0.08]" />
            }
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Columns <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize"
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-2xl bg-card shadow-soft overflow-clip">
        <Table wrapperClassName="overflow-auto max-h-[calc(100dvh-340px)]">
          <TableHeader className="sticky top-0 z-10 bg-card/90 backdrop-blur-xl">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent dark:hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => (
                    <TableCell
                      key={cell.id}
                      onClick={cellIndex === 0 && onRowClick ? () => onRowClick(row.original) : undefined}
                      className={cn(cellIndex === 0 && onRowClick && "font-medium hover:text-primary hover:underline underline-offset-4 decoration-primary/40")}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Inbox className="h-5 w-5 text-muted-foreground/70" />
                    </span>
                    <span className="text-sm">No results found.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground tabular-nums">
          {total !== undefined ? `${total} total records` : `${table.getFilteredRowModel().rows.length} records`}
        </p>
        {(isServerPagination ? pages > 1 : table.getPageCount() > 1) && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
              ) : (
                <Button
                  key={p}
                  variant="ghost"
                  size="icon-sm"
                  className={cn("tabular-nums text-[13px]", p === currentPage && "bg-primary/10 text-primary hover:bg-primary/15 shadow-none")}
                  onClick={() => onPageChange?.(p as number)}
                >
                  {p}
                </Button>
              )
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= pages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
