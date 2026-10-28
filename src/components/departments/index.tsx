"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar, DebouncedInput, FilterSelect } from "@/components/ui/filter-bar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/ui/data-table";
import { DepartmentModel } from "@/types/department";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatusPill } from "@/components/ui/status-pill";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDepartments } from "./hook";

const STATUS_OPTIONS = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

export function DepartmentList() {
  const {
    items, total, totalPage,
    page, setPage,
    search, statusFilter,
    setParam, clearFilters, hasFilters,
    dialogOpen, setDialogOpen, editing,
    form, onSubmit, isPending,
    openCreate, openEdit, deleteMutation,
  } = useDepartments();

  const columns: ColumnDef<DepartmentModel>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => <span className="font-mono text-[13px] font-medium text-primary">{row.getValue("code")}</span>,
    },
    { accessorKey: "name", header: "Name", cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span> },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("description") ?? "—"}</span>,
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
      enableHiding: false,
      cell: ({ row }) => {
        const dept = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-full text-muted-foreground" />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEdit(dept)}>
                  <Pencil className="h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => deleteMutation.mutate(dept._id)}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Manage organizational departments."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Department
          </Button>
        }
      />

      <DataTable
        filter={
          <FilterBar hasFilters={hasFilters} onClear={clearFilters}>
            <DebouncedInput
              label="Search"
              value={search}
              onChange={(v) => setParam("search", v)}
              placeholder="Code or name…"
              className="w-48"
              icon
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
        }
        columns={columns}
        data={items}
        page={page}
        totalPage={totalPage}
        total={total}
        onPageChange={setPage}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Department" : "New Department"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="IT" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="IT Department" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description <span className="text-muted-foreground">(optional)</span></FormLabel>
                  <FormControl><Input placeholder="Brief description..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0 rounded-xl bg-muted/60 px-4 py-3">
                  <FormLabel className="cursor-pointer">Active</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
