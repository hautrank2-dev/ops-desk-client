"use client";

import { Plus, Pencil, Trash2, Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar, DebouncedInput, FilterSelect } from "@/components/ui/filter-bar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    items, total, totalPage, isLoading,
    page, setPage,
    search, statusFilter,
    setParam, clearFilters, hasFilters,
    dialogOpen, setDialogOpen, editing,
    form, onSubmit, isPending,
    openCreate, openEdit, deleteMutation,
  } = useDepartments();

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
        <span className="text-[13px] text-muted-foreground ml-auto self-end pb-2 tabular-nums">{total} total</span>
      </FilterBar>

      <div className="rounded-2xl bg-card shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">No departments found.</TableCell>
              </TableRow>
            ) : items.map((dept) => (
              <TableRow key={dept._id}>
                <TableCell className="font-mono text-[13px] font-medium text-primary">{dept.code}</TableCell>
                <TableCell className="font-medium">{dept.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{dept.description ?? "—"}</TableCell>
                <TableCell>
                  {dept.isActive
                    ? <StatusPill dot tone="green">Active</StatusPill>
                    : <StatusPill dot tone="gray">Inactive</StatusPill>
                  }
                </TableCell>
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPage > 1 && (
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-[13px] text-muted-foreground tabular-nums">Page {page} / {totalPage}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPage} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

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
