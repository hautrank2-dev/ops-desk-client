"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, MoreHorizontal, Pencil, Eye, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DateRangeFilter, DebouncedInput, FilterBar, FilterLabel, FilterPopover, FilterSelect } from "@/components/ui/filter-bar";
import { UserCell } from "@/components/ui/user-cell";
import { UserSelect } from "@/components/selects/UserSelect";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TicketModel, TicketPriority, TicketStatus, TicketType, TableResponse } from "@/types";
import { httpClient } from "@/lib/httpClient";
import { StatusPill } from "@/components/ui/status-pill";
import { PageHeader } from "@/components/layout/PageHeader";
import { TICKET_PRIORITY_TONE, TICKET_STATUS_TONE } from "@/constants/tones";
import { CodeLink } from "@/components/ui/code-link";

const PAGE_SIZE = 10;

const toOptions = (values: string[]) => values.map((v) => ({ label: v, value: v }));

type TicketFilters = {
  code: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  assigneeId: string;
  createdStart: string;
  createdEnd: string;
  dueStart: string;
  dueEnd: string;
  sortBy: string;
  order: "asc" | "desc";
};

const EMPTY_FILTERS: TicketFilters = {
  code: "", title: "", status: "", priority: "", type: "", assigneeId: "",
  createdStart: "", createdEnd: "", dueStart: "", dueEnd: "",
  sortBy: "createdAt", order: "desc",
};

// Popover keys count toward the "Filters" badge; code/title stay inline.
const POPOVER_KEYS: (keyof TicketFilters)[] = [
  "status", "priority", "type", "assigneeId", "createdStart", "createdEnd", "dueStart", "dueEnd",
];

const SORT_OPTIONS = [
  { label: "Newest", value: "createdAt:desc" },
  { label: "Oldest", value: "createdAt:asc" },
  { label: "Priority: high → low", value: "priority:desc" },
  { label: "Priority: low → high", value: "priority:asc" },
  { label: "Status: new → closed", value: "status:asc" },
  { label: "Status: closed → new", value: "status:desc" },
  { label: "Due date: soonest", value: "dueAt:asc" },
  { label: "Due date: latest", value: "dueAt:desc" },
];

// Date inputs give yyyy-MM-dd; send full-day ISO bounds.
const dayStart = (d: string) => (d ? new Date(`${d}T00:00:00`).toISOString() : undefined);
const dayEnd = (d: string) => (d ? new Date(`${d}T23:59:59.999`).toISOString() : undefined);

export default function Page() {
  const [tickets, setTickets] = useState<TicketModel[]>([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<TicketFilters>(EMPTY_FILTERS);

  const setFilter = (patch: Partial<TicketFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const popoverCount = POPOVER_KEYS.filter((k) => filters[k]).length;
  const hasFilters = popoverCount > 0 || !!filters.code || !!filters.title;

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const f = filters;
        const { data } = await httpClient.get<TableResponse<TicketModel>>('/ticket', {
          params: {
            page,
            pageSize: PAGE_SIZE,
            populations: ["assigneeId"],
            code: f.code || undefined,
            title: f.title || undefined,
            status: f.status || undefined,
            priority: f.priority || undefined,
            type: f.type || undefined,
            assigneeId: f.assigneeId || undefined,
            startCreatedAt: dayStart(f.createdStart),
            endCreatedAt: dayEnd(f.createdEnd),
            startDueAt: dayStart(f.dueStart),
            endDueAt: dayEnd(f.dueEnd),
            sortBy: f.sortBy,
            order: f.order,
          },
        });
        setTickets(data.items || []);
        setTotalPage(data.totalPage ?? data.totalPages ?? 1);
        setTotal(data.total ?? 0);
      } catch (error) {
        console.error("Failed to fetch tickets", error);
        setTickets([]);
        setTotalPage(1);
        setTotal(0);
      }
    };
    fetchTickets();
  }, [page, filters]);

  const columns: ColumnDef<TicketModel>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => <CodeLink href={`/tickets/${row.original._id}`} code={row.original.code} />,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span className="max-w-[280px] truncate block">{row.getValue("title")}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <StatusPill>{row.getValue("type")}</StatusPill>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as TicketPriority;
        return <StatusPill tone={TICKET_PRIORITY_TONE[priority]}>{priority}</StatusPill>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as TicketStatus;
        return <StatusPill dot tone={TICKET_STATUS_TONE[status]}>{status}</StatusPill>;
      },
    },
    {
      id: "assignee",
      header: "Assignee",
      cell: ({ row }) => <UserCell user={row.original.assigneeId} />,
    },
    {
      accessorKey: "dueAt",
      header: "Due",
      cell: ({ row }) => {
        const dueAt = row.original.dueAt;
        return <span className="text-muted-foreground text-[13px] tabular-nums">{dueAt ? format(new Date(dueAt), "MMM d, yyyy") : "—"}</span>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => <span className="text-muted-foreground text-[13px] tabular-nums">{format(new Date(row.getValue("createdAt")), "MMM d, yyyy")}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const ticket = row.original as TicketModel;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-full text-muted-foreground" />}>
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <Link href={`/tickets/${ticket._id}`}>
                <DropdownMenuItem>
                  <Eye className="h-4 w-4" /> View Details
                </DropdownMenuItem>
              </Link>
              <Link href={`/tickets/${ticket._id}/edit`}>
                <DropdownMenuItem>
                  <Pencil className="h-4 w-4" /> Edit
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <AlertTriangle className="h-4 w-4" /> Cancel Ticket
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets"
        description="Track and manage maintenance requests and repairs."
        actions={
          <Link href="/tickets/new">
            <Button>
              <Plus className="h-4 w-4" /> Create Ticket
            </Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={tickets}
        filter={
          <FilterBar hasFilters={hasFilters} onClear={() => setFilter({ ...EMPTY_FILTERS, sortBy: filters.sortBy, order: filters.order })}>
            <DebouncedInput value={filters.code} onChange={(v) => setFilter({ code: v })} placeholder="Code" className="w-36" icon />
            <DebouncedInput value={filters.title} onChange={(v) => setFilter({ title: v })} placeholder="Search title..." className="w-56" icon />
            <FilterPopover activeCount={popoverCount} onClear={() => setFilter(Object.fromEntries(POPOVER_KEYS.map((k) => [k, ""])))}>
              <div className="grid grid-cols-2 gap-3">
                <FilterSelect label="Status" value={filters.status} onChange={(v) => setFilter({ status: v })} placeholder="All" options={toOptions(Object.values(TicketStatus))} />
                <FilterSelect label="Priority" value={filters.priority} onChange={(v) => setFilter({ priority: v })} placeholder="All" options={toOptions(Object.values(TicketPriority))} />
                <FilterSelect label="Type" value={filters.type} onChange={(v) => setFilter({ type: v })} placeholder="All" options={toOptions(Object.values(TicketType))} />
                <FilterLabel label="Assignee"><UserSelect value={filters.assigneeId} onChange={(v) => setFilter({ assigneeId: v })} placeholder="Anyone" status="all" /></FilterLabel>
              </div>
              <DateRangeFilter label="Created" start={filters.createdStart} end={filters.createdEnd} onChange={({ start, end }) => setFilter({ createdStart: start, createdEnd: end })} />
              <DateRangeFilter label="Due date" start={filters.dueStart} end={filters.dueEnd} onChange={({ start, end }) => setFilter({ dueStart: start, dueEnd: end })} />
            </FilterPopover>
            <FilterSelect
              value={`${filters.sortBy}:${filters.order}`}
              onChange={(v) => {
                const [sortBy, order] = (v || "createdAt:desc").split(":");
                setFilter({ sortBy, order: order as "asc" | "desc" });
              }}
              placeholder="Sort"
              options={SORT_OPTIONS}
              className="w-52"
            />
          </FilterBar>
        }
        page={page}
        totalPage={totalPage}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
