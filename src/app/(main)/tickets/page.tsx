"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, MoreHorizontal, Pencil, Eye, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
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

const PAGE_SIZE = 10;

export default function Page() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketModel[]>([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data } = await httpClient.get<TableResponse<TicketModel>>('/ticket', {
          params: { page, pageSize: PAGE_SIZE, search: search || undefined },
        });
        setTickets(data.items || []);
        setTotalPage(data.totalPage ?? data.totalPages ?? 1);
        setTotal(data.total ?? 0);
      } catch (error) {
        console.error("Failed to fetch tickets", error);
        setTickets([
          { _id: "1", code: "TKT-001", title: "AC leaking in Room 302", type: TicketType.Repair, priority: TicketPriority.High, status: TicketStatus.Doing, assetItemIds: ["1"], images: [], imageUrls: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { _id: "2", code: "TKT-002", title: "Annual Server Maintenance", type: TicketType.Maintenance, priority: TicketPriority.Medium, status: TicketStatus.New, assetItemIds: ["2"], images: [], imageUrls: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { _id: "3", code: "TKT-003", title: "Broken window in lobby", type: TicketType.Incident, priority: TicketPriority.Urgent, status: TicketStatus.Waiting, assetItemIds: ["3"], images: [], imageUrls: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ]);
        setTotalPage(1);
        setTotal(3);
      }
    };
    fetchTickets();
  }, [page, search]);

  const columns: ColumnDef<TicketModel>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => <span className="font-mono text-[13px] font-medium text-primary">{row.getValue("code")}</span>,
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
        searchPlaceholder="Search tickets..."
        onSearch={(v) => { setSearch(v); setPage(1); }}
        page={page}
        totalPage={totalPage}
        total={total}
        onPageChange={setPage}
        onRowClick={(ticket) => router.push(`/tickets/${ticket._id}`)}
      />
    </div>
  );
}
