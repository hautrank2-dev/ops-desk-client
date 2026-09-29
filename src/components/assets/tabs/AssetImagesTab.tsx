"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageManager } from "@/components/ui/image-manager";

type Props = {
  assetId: string;
  imageUrls: string[];
};

export function AssetImagesTab({ assetId, imageUrls }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle>Images</CardTitle></CardHeader>
      <CardContent>
        <ImageManager
          imageUrls={imageUrls}
          basePath={`/asset/${assetId}`}
          invalidateKeys={[["asset", assetId], ["assets"]]}
        />
      </CardContent>
    </Card>
  );
}
