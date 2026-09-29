import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TablePaginationProps {
  page: number
  totalPage: number
  total?: number
  onPageChange: (page: number) => void
}

function getPageNumbers(page: number, totalPage: number): (number | "...")[] {
  if (totalPage <= 7) return Array.from({ length: totalPage }, (_, i) => i + 1)
  const delta = 2
  const range: (number | "...")[] = []
  const left = Math.max(2, page - delta)
  const right = Math.min(totalPage - 1, page + delta)
  range.push(1)
  if (left > 2) range.push("...")
  for (let i = left; i <= right; i++) range.push(i)
  if (right < totalPage - 1) range.push("...")
  range.push(totalPage)
  return range
}

export function TablePagination({ page, totalPage, total, onPageChange }: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[13px] text-muted-foreground tabular-nums">
        {total !== undefined ? `${total} total records` : ""}
      </p>
      {totalPage > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {getPageNumbers(page, totalPage).map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
            ) : (
              <Button
                key={p}
                variant="ghost"
                size="icon-sm"
                className={cn("tabular-nums text-[13px]", p === page && "bg-primary/10 text-primary hover:bg-primary/15 shadow-none")}
                onClick={() => onPageChange(p as number)}
              >
                {p}
              </Button>
            )
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
