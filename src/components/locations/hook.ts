"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { httpClient } from "@/lib/httpClient";
import { LocationModel, FloorType, CreateLocationDto } from "@/types/location";
import { TableResponse } from "@/types/api";
import { useApp } from "@/contexts/AppContext";

export const locationSchema = z.object({
  code: z.string().min(1, "Required"),
  name: z.string().min(1, "Required"),
  floor: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean(),
});

export type LocationFormValues = z.infer<typeof locationSchema>;

const PAGE_SIZE = 10;

export function useLocations() {
  const queryClient = useQueryClient();
  const { refetchLocations } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read filters from URL
  const page = Number(searchParams.get("page") ?? 1);
  const search = searchParams.get("name") ?? "";
  const floorFilter = searchParams.get("floor") ?? "";
  const statusFilter = searchParams.get("isActive") ?? "";

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page"); // reset page on filter change
    router.replace(`${pathname}?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p > 1) params.set("page", String(p)); else params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => router.replace(pathname);

  const hasFilters = !!(search || floorFilter || statusFilter);

  const { data, isLoading } = useQuery<TableResponse<LocationModel>>({
    queryKey: ["locations-page", page, search, floorFilter, statusFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, pageSize: PAGE_SIZE };
      if (search) params.name = search;
      if (floorFilter) params.floor = floorFilter;
      if (statusFilter !== "") params.isActive = statusFilter === "true";
      const { data } = await httpClient.get("/location", { params });
      if (Array.isArray(data)) return { items: data, page: 1, pageSize: PAGE_SIZE, total: data.length, totalPage: 1 };
      return data;
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LocationModel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LocationModel | null>(null);

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: { code: "", name: "", floor: "", description: "", isActive: true },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ code: "", name: "", floor: "", description: "", isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (loc: LocationModel) => {
    setEditing(loc);
    form.reset({
      code: loc.code,
      name: loc.name,
      floor: loc.floor != null ? String(loc.floor) : "",
      description: loc.description ?? "",
      isActive: loc.isActive,
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: LocationFormValues) => {
      const body: CreateLocationDto = {
        code: values.code,
        name: values.name,
        floor: (values.floor as FloorType) || null,
        description: values.description,
        isActive: values.isActive,
      };
      if (editing) {
        const { data } = await httpClient.patch(`/location/${editing._id}`, body);
        return data;
      }
      const { data } = await httpClient.post("/location", body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations-page"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      refetchLocations();
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await httpClient.delete(`/location/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations-page"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      refetchLocations();
      setDeleteTarget(null);
    },
  });

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    totalPage: data?.totalPage ?? data?.totalPages ?? 1,
    isLoading,
    page, setPage,
    search, floorFilter, statusFilter,
    setParam, clearFilters, hasFilters,
    dialogOpen, setDialogOpen,
    editing, deleteTarget, setDeleteTarget,
    form,
    onSubmit: (values: LocationFormValues) => saveMutation.mutate(values),
    isPending: saveMutation.isPending,
    openCreate, openEdit,
    deleteMutation,
  };
}
