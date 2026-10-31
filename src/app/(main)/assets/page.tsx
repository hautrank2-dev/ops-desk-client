"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, MoreHorizontal, Pencil, ExternalLink } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { FilterBar, DebouncedInput, FilterSelect } from "@/components/ui/filter-bar";
import { UserCell } from "@/components/ui/user-cell";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AssetModel, AssetType, TableResponse } from "@/types";
import { httpClient } from "@/lib/httpClient";
import { StatusPill } from "@/components/ui/status-pill";
import { PageHeader } from "@/components/layout/PageHeader";
import { CodeLink } from "@/components/ui/code-link";

const PAGE_SIZE = 10;

const TYPE_OPTIONS = Object.values(AssetType).map((t) => ({ label: t, value: t }));
const ACTIVE_OPTIONS = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

type Filters = {
  code: string;
  name: string;
  type: string;
  vendor: string;
  model: string;
  active: string;
};

const EMPTY: Filters = { code: "", name: "", type: "", vendor: "", model: "", active: "" };

export default function Page() {
  const [assets, setAssets] = useState<AssetModel[]>([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Filters>(EMPTY);

  const set = (key: keyof Filters) => (v: string) => {
    setFilters((f) => ({ ...f, [key]: v }));
    setPage(1);
  };

  const hasFilters = Object.values(filters).some(Boolean);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const params: Record<string, unknown> = { page, pageSize: PAGE_SIZE, itemCount: true };
        if (filters.code) params.code = filters.code;
        if (filters.name) params.name = filters.name;
        if (filters.type) params.type = filters.type;
        if (filters.vendor) params.vendor = filters.vendor;
        if (filters.model) params.model = filters.model;
        if (filters.active !== "") params.active = filters.active === "true";

        const { data } = await httpClient.get<TableResponse<AssetModel>>("/asset", { params });
        setAssets(data.items || []);
        setTotalPage(data.totalPage ?? data.totalPages ?? 1);
        setTotal(data.total ?? 0);
      } catch {
        setTotalPage(1); setTotal(3);
      }
    };
    fetchAssets();
  }, [page, filters]);

  const columns: ColumnDef<AssetModel>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => <CodeLink href={`/assets/${row.original._id}?tab=items`} code={row.original.code} />,
    },
    { accessorKey: "name", header: "Name", cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span> },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <StatusPill>{row.getValue("type")}</StatusPill>
      ),
    },
    { accessorKey: "vendor", header: "Vendor" },
    { accessorKey: "model", header: "Model" },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => row.getValue("active")
        ? <StatusPill dot tone="green">Active</StatusPill>
        : <StatusPill dot tone="gray">Inactive</StatusPill>,
    },
    {
      id: "itemCount",
      header: "Items",
      cell: ({ row }) => {
        const ic = row.original.itemCount;
        if (!ic) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <span
            className="inline-flex items-center gap-1 font-mono text-xs tabular-nums"
            title={`Available: ${ic.Active ?? 0} · Maintenance: ${ic.Maintenance ?? 0} · Retired: ${ic.Retired ?? 0}`}
          >
            <span className="font-semibold">{ic.total}</span>
            {ic.Active > 0 && <span className="text-[#1a7f35] dark:text-[#5fe07e]">·{ic.Active}</span>}
            {ic.Maintenance > 0 && <span className="text-[#c26a00] dark:text-[#ffb547]">·{ic.Maintenance}</span>}
            {ic.Retired > 0 && <span className="text-muted-foreground/70">·{ic.Retired}</span>}
          </span>
        );
      },
    },
    {
      id: "createdBy",
      header: "Created by",
      cell: ({ row }) => <UserCell user={row.original.createdBy} />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const asset = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-full text-muted-foreground" />}>
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <Link href={`/assets/${asset._id}`}>
                  <DropdownMenuItem className="cursor-pointer"><Pencil /> Edit</DropdownMenuItem>
                </Link>
                {asset.purchaseUrl && (
                  <a href={asset.purchaseUrl} target="_blank" rel="noopener noreferrer">
                    <DropdownMenuItem className="cursor-pointer"><ExternalLink /> View Purchase</DropdownMenuItem>
                  </a>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assets"
        description="Manage your organization's physical and digital assets."
        actions={
          <Link href="/assets/new">
            <Button><Plus className="h-4 w-4" /> Add Asset</Button>
          </Link>
        }
      />

      <DataTable
        filter={
          <FilterBar hasFilters={hasFilters} onClear={() => { setFilters(EMPTY); setPage(1); }}>
            <DebouncedInput value={filters.code} onChange={set("code")} placeholder="Code…" className="w-32" />
            <DebouncedInput value={filters.name} onChange={set("name")} placeholder="Name…" className="w-44" />
            <FilterSelect value={filters.type} onChange={set("type")} placeholder="All types" options={TYPE_OPTIONS} className="w-36" />
            <DebouncedInput value={filters.vendor} onChange={set("vendor")} placeholder="Vendor…" className="w-36" />
            <DebouncedInput value={filters.model} onChange={set("model")} placeholder="Model…" className="w-36" />
            <FilterSelect value={filters.active} onChange={set("active")} placeholder="All status" options={ACTIVE_OPTIONS} className="w-32" />
          </FilterBar>
        }
        columns={columns}
        data={assets}
        page={page}
        totalPage={totalPage}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
