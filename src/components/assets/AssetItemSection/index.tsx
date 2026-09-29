"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Loader2, Package, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssetItemModel, ItemStatus } from "@/types/asset-item";
import { useApp } from "@/contexts/AppContext";
import { formatDate } from "@/lib/formatDate";
import { UserCell } from "@/components/ui/user-cell";
import { StatusPill } from "@/components/ui/status-pill";
import { ITEM_STATUS_TONE } from "@/constants/tones";
import { AssetItemForm } from "./AssetItemForm";
import { AssetItemEditForm } from "./AssetItemEditForm";
import { type AssetItemSectionProps, useAssetItemSection } from "./hook";

function LocationCell({ item }: { item: AssetItemModel }) {
  const { locationsMap } = useApp();
  const loc = (typeof item.location === "object" && item.location) ?? locationsMap[item.locationId ?? ""];
  return loc
    ? <span className="text-sm">{loc.name}</span>
    : <span className="text-muted-foreground">—</span>;
}

function buildColumns(onEdit: (item: AssetItemModel) => void): ColumnDef<AssetItemModel>[] {
  return [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-[13px] font-medium text-primary">
          {row.original.code ?? row.original._id.slice(-8).toUpperCase()}
        </span>
      ),
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
      cell: ({ row }) => <LocationCell item={row.original} />,
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
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="icon-sm" className="rounded-full text-muted-foreground" onClick={(e) => { e.stopPropagation(); onEdit(row.original); }}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];
}

export function AssetItemSection(props: AssetItemSectionProps) {
  const {
    items, isLoading,
    createMutation, addOpen, setAddOpen,
    updateMutation, editItem, setEditItem,
    bulkStatusMutation,
  } = useAssetItemSection(props);

  const [selected, setSelected] = useState<AssetItemModel[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>("");

  const columns = buildColumns(setEditItem);

  const handleBulkApply = () => {
    if (!bulkStatus || selected.length === 0) return;
    bulkStatusMutation.mutate(
      { assetItemId: selected.map((i) => i._id), status: bulkStatus as ItemStatus },
      { onSuccess: () => { setSelected([]); setBulkStatus(""); } }
    );
  };

  return (
    <div>
      <div className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Asset Items</CardTitle>
          <p className="text-[13px] text-muted-foreground mt-0.5 tabular-nums">
            {items.length} item{items.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Items
        </Button>
      </div>

      <div className="space-y-4">
        {/* Bulk action bar — only visible when rows are selected */}
        {selected.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-primary/[0.06] ring-1 ring-primary/15 px-3 py-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <span className="text-[13px] font-medium text-primary shrink-0 tabular-nums">
              {selected.length} selected
            </span>
            <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as ItemStatus)}>
              <SelectTrigger size="sm" className="w-44 text-[13px] bg-card">
                <SelectValue placeholder="Change status…" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ItemStatus).map((s) => (
                  <SelectItem key={s} value={s} className="text-[13px]">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={!bulkStatus || bulkStatusMutation.isPending}
              onClick={handleBulkApply}
            >
              {bulkStatusMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Apply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-muted-foreground"
              onClick={() => setSelected([])}
            >
              Clear
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Package className="h-6 w-6 text-muted-foreground/70" />
            </span>
            <p className="text-sm">No items yet. Add some items to track.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            enableRowSelection
            getRowId={(row) => row._id}
            onSelectionChange={setSelected}
          />
        )}
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Asset Items</DialogTitle>
          </DialogHeader>
          <AssetItemForm createMutation={createMutation} onCancel={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item — {editItem?.code ?? editItem?._id.slice(-8).toUpperCase()}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <AssetItemEditForm
              item={editItem}
              updateMutation={updateMutation}
              onCancel={() => setEditItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
