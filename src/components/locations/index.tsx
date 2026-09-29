"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { FilterBar, DebouncedInput, FilterSelect } from "@/components/ui/filter-bar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LocationForm } from "./LocationForm";
import { LocationModel } from "@/types/location";
import { FLOOR_OPTIONS } from "@/constants/data";
import { StatusPill } from "@/components/ui/status-pill";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLocations } from "./hook";

const FLOOR_FILTER_OPTIONS = FLOOR_OPTIONS.map((f) => ({ label: f.label, value: String(f.value) }));
const STATUS_OPTIONS = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

export function LocationList() {
  const {
    items, total, totalPage, isLoading,
    page, setPage,
    search, floorFilter, statusFilter,
    setParam, clearFilters, hasFilters,
    dialogOpen, setDialogOpen,
    editing, deleteTarget, setDeleteTarget,
    form, onSubmit, isPending,
    openCreate, openEdit,
    deleteMutation,
  } = useLocations();

  const columns: ColumnDef<LocationModel>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => <span className="font-mono text-[13px] font-medium text-primary">{row.getValue("code")}</span>,
    },
    { accessorKey: "name", header: "Name", cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span> },
    {
      accessorKey: "floor",
      header: "Floor",
      cell: ({ row }) => row.getValue("floor") ?? <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.getValue("description") ?? <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => row.getValue("isActive")
        ? <StatusPill dot tone="green">Active</StatusPill>
        : <StatusPill dot tone="gray">Inactive</StatusPill>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const loc = row.original;
        return (
          <div className="flex items-center justify-end gap-0.5">
            <Button variant="ghost" size="icon-sm" className="rounded-full text-muted-foreground" onClick={() => openEdit(loc)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="rounded-full hover:bg-destructive/10" onClick={() => setDeleteTarget(loc)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Manage physical locations and floors."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Location
          </Button>
        }
      />

      <FilterBar hasFilters={hasFilters} onClear={clearFilters}>
        <DebouncedInput
          label="Name"
          value={search}
          onChange={(v) => setParam("name", v)}
          placeholder="Search name…"
          className="w-44"
          icon
        />
        <FilterSelect
          label="Floor"
          value={floorFilter}
          onChange={(v) => setParam("floor", v)}
          placeholder="All floors"
          options={FLOOR_FILTER_OPTIONS}
          className="w-36"
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={(v) => setParam("isActive", v)}
          placeholder="All status"
          options={STATUS_OPTIONS}
          className="w-32"
        />
      </FilterBar>

      <DataTable
        columns={columns}
        data={items}
        page={page}
        totalPage={totalPage}
        total={total}
        onPageChange={setPage}
      />

      <LocationForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        onSubmit={onSubmit}
        isPending={isPending}
        isEdit={!!editing}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
