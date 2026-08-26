"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { UserModel, UserRoleEnum, UserStatusEnum } from "@/types/user";
import { DepartmentModel } from "@/types/department";
import { TableResponse } from "@/types/api";

export const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  name: z.string().min(2, "Name is required"),
  role: z.enum(["admin", "manager", "user"] as const),
  deptId: z.string().optional(),
  status: z.enum(["active", "blocked"] as const),
});

export type UserFormValues = z.infer<typeof userSchema>;

export function useUsers() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserModel | null>(null);

  const { data, isLoading } = useQuery<TableResponse<UserModel>>({
    queryKey: ["users-list", page, search],
    queryFn: async () => {
      const { data } = await httpClient.get("/user", {
        params: { page, pageSize: 10, search: search || undefined },
      });
      if (Array.isArray(data)) {
        return { items: data, total: data.length, page: 1, pageSize: data.length, totalPage: 1 };
      }
      return data;
    },
  });

  const { data: departments = [] } = useQuery<DepartmentModel[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await httpClient.get("/department");
      return Array.isArray(data) ? data : data.items ?? [];
    },
    enabled: dialogOpen,
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { username: "", email: "", password: "", name: "", role: "user", deptId: "", status: "active" },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ username: "", email: "", password: "", name: "", role: "user", deptId: "", status: "active" });
    setDialogOpen(true);
  };

  const openEdit = (user: UserModel) => {
    setEditing(user);
    form.reset({
      username: user.username,
      email: user.email,
      password: "",
      name: user.name,
      role: user.role,
      deptId: user.deptId ?? "",
      status: user.status,
    });
    setDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const { data } = await httpClient.post("/user", values);
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users-list"] }); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const payload: Partial<UserFormValues> = { ...values };
      if (!payload.password) delete payload.password;
      if (!payload.deptId) delete payload.deptId;
      const { data } = await httpClient.patch(`/user/${editing?._id}`, payload);
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users-list"] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await httpClient.delete(`/user/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users-list"] }); },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: UserFormValues) => {
    if (editing) updateMutation.mutate(values);
    else createMutation.mutate(values);
  };

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    totalPage: data?.totalPage ?? data?.totalPages ?? 1,
    isLoading,
    page, setPage,
    search, setSearch,
    dialogOpen, setDialogOpen,
    editing,
    departments,
    form, onSubmit, isPending,
    openCreate, openEdit,
    deleteMutation,
    UserRoleEnum, UserStatusEnum,
  };
}
