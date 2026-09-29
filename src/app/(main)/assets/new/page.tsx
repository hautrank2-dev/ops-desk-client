"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { AssetInfoTab } from "@/components/assets/tabs/AssetInfoTab";

export default function Page() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <PageHeader
        onBack={() => router.push("/assets")}
        title="New Asset"
        description="Add a new asset to the system"
      />
      <AssetInfoTab isCreate />
    </div>
  );
}
