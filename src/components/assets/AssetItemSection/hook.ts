"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { AssetItemModel, ItemStatus, UpdateAssetItemDto } from "@/types/asset-item";
import { TableResponse } from "@/types/api";

export type AssetItemSectionProps = {
  assetId: string;
};

export function useAssetItemSection({ assetId }: AssetItemSectionProps) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<AssetItemModel | null>(null);

  const { data: items = [], isLoading } = useQuery<AssetItemModel[]>({
    queryKey: ["asset-items", assetId],
    queryFn: async () => {
      const { data } = await httpClient.get<TableResponse<AssetItemModel> | AssetItemModel[]>(
        "/asset-item",
        { params: { assetId, populations: ["createdBy", "updatedBy"] } }
      );
      return Array.isArray(data) ? data : data.items;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["asset-items", assetId] });

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await httpClient.post(`/asset/${assetId}/items`, body);
      return data;
    },
    onSuccess: () => { invalidate(); setAddOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateAssetItemDto }) => {
      const { data } = await httpClient.patch(`/asset-item/${id}`, dto);
      return data;
    },
    onSuccess: () => { invalidate(); setEditItem(null); },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ assetItemId, status }: { assetItemId: string[]; status: ItemStatus }) => {
      const { data } = await httpClient.patch("/asset-item/update-status", { assetItemId, status });
      return data;
    },
    onSuccess: invalidate,
  });

  return {
    items, isLoading,
    createMutation, addOpen, setAddOpen,
    updateMutation, editItem, setEditItem,
    bulkStatusMutation,
  };
}
