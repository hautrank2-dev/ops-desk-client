"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetInfoTab } from "@/components/assets/tabs/AssetInfoTab";
import { AssetImagesTab } from "@/components/assets/tabs/AssetImagesTab";
import { AssetItemsTab } from "@/components/assets/tabs/AssetItemsTab";
import { AssetModel } from "@/types/asset";
import { httpClient } from "@/lib/httpClient";
import { CopyButton } from "@/components/ui/copy-button";

type Tab = "items" | "info" | "images";
const TABS: Tab[] = ["items", "info", "images"];

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get("tab") as Tab | null;
  const activeTab: Tab = rawTab && TABS.includes(rawTab) ? rawTab : "items";

  const setTab = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/assets/${id}?${params.toString()}`);
    },
    [id, router, searchParams]
  );

  const { data: asset, isLoading } = useQuery<AssetModel>({
    queryKey: ["asset", id],
    queryFn: async () => {
      const { data } = await httpClient.get(`/asset/${id}`);
      return data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        onBack={() => router.push("/assets")}
        title={isLoading ? <Loader2 className="h-6 w-6 my-1 animate-spin text-muted-foreground" /> : <span className="inline-flex items-center gap-2">{asset?.code}<CopyButton value={asset?.code} /></span>}
        description={isLoading ? undefined : asset?.name}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="images">
            Images
            {(asset?.imageUrls?.length ?? 0) > 0 && (
              <span className="ml-0.5 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-primary/12 text-primary px-1.5 text-[11px] font-semibold tabular-nums">
                {asset?.imageUrls.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-5">
          <AssetItemsTab assetId={id} />
        </TabsContent>

        <TabsContent value="info" className="mt-5">
          {!isLoading && <AssetInfoTab asset={asset} />}
        </TabsContent>

        <TabsContent value="images" className="mt-5">
          {asset && (
            <AssetImagesTab
              assetId={id}
              imageUrls={asset.imageUrls ?? []}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
