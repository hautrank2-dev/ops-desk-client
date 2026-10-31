"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { FilterBar, DebouncedInput, FilterSelect } from "@/components/ui/filter-bar";
import { AssetCombobox } from "@/components/ui/asset-combobox";
import { UserCell } from "@/components/ui/user-cell";
import { AssetItemModel, ItemStatus, TableResponse } from "@/types";
import { useApp } from "@/contexts/AppContext";
import { httpClient } from "@/lib/httpClient";
import { formatDate } from "@/lib/formatDate";
import { StatusPill } from "@/components/ui/status-pill";
import { PageHeader } from "@/components/layout/PageHeader";
import { ITEM_STATUS_TONE } from "@/constants/tones";
import { CodeLink } from "@/components/ui/code-link";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = Object.values(ItemStatus).map((s) => ({ label: s, value: s }));

type Filters = {
  code: string;
  serialNumber: string;
  locationId: string;
  assetId: string;
  status: string;
};

const EMPTY: Filters = { code: "", serialNumber: "", locationId: "", assetId: "", status: "" };

export default function Page() {
  const searchParams = useSearchParams();
  const { locations } = useApp();

  const [items, setItems] = useState<AssetItemModel[]>([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY,
    assetId: searchParams.get("assetId") ?? "",
  });

  const set = (key: keyof Filters) => (v: string) => {
    setFilters((f) => ({ ...f, [key]: v }));
    setPage(1);
  };

  const hasFilters = Object.values(filters).some(Boolean);

  const locationOptions = locations.map((l) => ({ label: l.name, value: l._id }));

  useEffect(() => {
    const fetch = async () => {
      try {
        const params: Record<string, unknown> = {
          page, pageSize: PAGE_SIZE,
          populations: ["createdBy", "assetId"],
        };
        if (filters.code) params.code = filters.code;
        if (filters.serialNumber) params.serialNumber = filters.serialNumber;
        if (filters.locationId) params.locationId = filters.locationId;
        if (filters.assetId) params.assetId = filters.assetId;
        if (filters.status) params.status = filters.status;

        const { data } = await httpClient.get<TableResponse<AssetItemModel> | AssetItemModel[]>(
          "/asset-item", { params }
        );
        const result = Array.isArray(data) ? data : data.items;
        const meta = Array.isArray(data) ? null : data;
        setItems(result);
        setTotalPage(meta?.totalPage ?? meta?.totalPages ?? 1);
        setTotal(meta?.total ?? result.length);
      } catch {
        setItems([]);
      }
    };
    fetch();
  }, [page, filters]);

  const columns: ColumnDef<AssetItemModel>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => {
        const a = row.original.assetId;
        const code = row.original.code ?? row.original._id.slice(-8).toUpperCase();
        // Items have no page of their own — they are managed on their asset's Items tab.
        if (a && typeof a === "object") return <CodeLink href={`/assets/${a._id}?tab=items`} code={code} />;
        return <span className="font-mono text-[13px] font-medium text-primary">{code}</span>;
      },
    },
    {
      id: "asset",
      header: "Asset",
      cell: ({ row }) => {
        const a = row.original.assetId;
        if (!a) return <span className="text-muted-foreground">—</span>;
        if (typeof a === "object") return <CodeLink href={`/assets/${a._id}?tab=items`} code={a.code} />;
        return <span className="font-mono text-xs text-muted-foreground">{a}</span>;
      },
    },
    {
      accessorKey: "serialNumber",
      header: "Serial No.",
      cell: ({ row }) => row.original.serialNumber
        ? <span className="text-xs font-mono">{row.original.serialNumber}</span>
        : <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <StatusPill dot tone={ITEM_STATUS_TONE[s]}>
            {s}
          </StatusPill>
        );
      },
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => {
        const item = row.original;
        const loc = (typeof item.location === "object" && item.location) ?? locations.find((l) => l._id === item.locationId);
        return loc ? <span className="text-sm">{loc.name}</span> : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      id: "createdBy",
      header: "Created by",
      cell: ({ row }) => <UserCell user={row.original.createdBy} />,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-[13px] tabular-nums" title={row.getValue("createdAt")}>
          {formatDate(row.getValue("createdAt"))}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Asset Items" description="All registered asset items across the organization." />

      <DataTable
        filter={
          <FilterBar hasFilters={hasFilters} onClear={() => { setFilters(EMPTY); setPage(1); }}>
            <DebouncedInput value={filters.code} onChange={set("code")} placeholder="Code…" className="w-32" />
            <DebouncedInput value={filters.serialNumber} onChange={set("serialNumber")} placeholder="Serial No…" className="w-36" />
            <FilterSelect
              value={filters.locationId}
              onChange={set("locationId")}
              placeholder="All locations"
              options={locationOptions}
              className="w-44"
            />
            <AssetCombobox
              value={filters.assetId}
              onChange={set("assetId")}
              className="w-56"
            />
            <FilterSelect
              value={filters.status}
              onChange={set("status")}
              placeholder="All status"
              options={STATUS_OPTIONS}
              className="w-40"
            />
          </FilterBar>
        }
        columns={columns}
        data={items}
        page={page}
        totalPage={totalPage}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
