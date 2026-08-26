"use client";

import { useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { httpClient } from "@/lib/httpClient";
import { DepartmentModel } from "@/types/department";
import { TableResponse } from "@/types/api";

export const deptSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
});

export type DeptFormValues = z.infer<typeof deptSchema>;

export function useDepartments() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1);
  const search = searchParams.get("search") ?? "";
  const statusFilter = searchParams.get("isActive") ?? "";

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p > 1) params.set("page", String(p)); else params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => router.replace(pathname);
  const hasFilters = !!(search || statusFilter);

  const { data, isLoading } = useQuery<TableResponse<DepartmentModel>>({
    queryKey: ["departments-list", page, search, statusFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, pageSize: 10 };
      if (search) params.search = search;
      if (statusFilter !== "") params.isActive = statusFilter === "true";
      const { data } = await httpClient.get("/department", { params });
      if (Array.isArray(data)) {
        return { items: data, total: data.length, page: 1, pageSize: data.length, totalPage: 1 };
      }
      return data;
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentModel | null>(null);

  const form: UseFormReturn<DeptFormValues> = useForm<DeptFormValues>({
    resolver: zodResolver(deptSchema),
    defaultValues: { code: "", name: "", description: "", isActive: true },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ code: "", name: "", description: "", isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (dept: DepartmentModel) => {
    setEditing(dept);
    form.reset({ code: dept.code, name: dept.name, description: dept.description ?? "", isActive: dept.isActive });
    setDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async (values: DeptFormValues) => {
      const { data } = await httpClient.post("/department", { ...values, code: values.code.toUpperCase() });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments-list"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: DeptFormValues) => {
      const { data } = await httpClient.patch(`/department/${editing?._id}`, values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments-list"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await httpClient.delete(`/department/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["departments-list"] }); },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: DeptFormValues) => {
    if (editing) updateMutation.mutate(values);
    else createMutation.mutate(values);
  };

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    totalPage: data?.totalPage ?? 1,
    isLoading,
    page, setPage,
    search, statusFilter,
    setParam, clearFilters, hasFilters,
    dialogOpen, setDialogOpen,
    editing,
    form, onSubmit, isPending,
    openCreate, openEdit,
    deleteMutation,
  };
}
