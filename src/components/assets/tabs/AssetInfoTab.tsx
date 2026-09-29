"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { AssetModel, AssetType } from "@/types/asset";
import { httpClient } from "@/lib/httpClient";

const schema = z.object({
  code: z.string().min(3, "At least 3 characters"),
  name: z.string().min(3, "At least 3 characters"),
  type: z.enum(["Device", "Appliance", "Furniture", "IT", "Facility"] as const),
  vendor: z.string().optional(),
  model: z.string().optional(),
  purchaseUrl: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.instanceof(File)).optional(),
});

type Values = z.infer<typeof schema>;

type Props = {
  /** undefined = create mode */
  asset?: AssetModel;
  isCreate?: boolean;
};

export function AssetInfoTab({ asset, isCreate }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = asset?._id;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "", name: "", type: AssetType.Device,
      vendor: "", model: "", purchaseUrl: "", description: "", images: [],
    },
  });

  useEffect(() => {
    if (asset) {
      form.reset({
        code: asset.code, name: asset.name, type: asset.type,
        vendor: asset.vendor ?? "", model: asset.model ?? "",
        purchaseUrl: asset.purchaseUrl ?? "", description: asset.description ?? "",
        images: [],
      });
    }
  }, [asset, form]);

  const buildFd = (v: Values) => {
    const fd = new FormData();
    fd.append("code", v.code);
    fd.append("name", v.name);
    fd.append("type", v.type);
    if (v.vendor) fd.append("vendor", v.vendor);
    if (v.model) fd.append("model", v.model);
    if (v.purchaseUrl) fd.append("purchaseUrl", v.purchaseUrl);
    if (v.description) fd.append("description", v.description);
    v.images?.forEach((f) => fd.append("images", f));
    return fd;
  };

  const mutation = useMutation({
    mutationFn: async (v: Values) => {
      const fd = buildFd(v);
      const headers = { "Content-Type": "multipart/form-data" };
      if (isCreate) {
        const { data } = await httpClient.post("/asset", fd, { headers });
        return data;
      }
      const { code, images, ...updateValues} = v;
      const { data } = await httpClient.patch(`/asset/${id}`, updateValues);
      return data;
    },
    onSuccess: (data: AssetModel) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      if (isCreate) {
        router.push(`/assets/${data._id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["asset", id] });
      }
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem><FormLabel>Asset Code</FormLabel><FormControl><Input placeholder="AST-001" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Asset Name</FormLabel><FormControl><Input placeholder="e.g. MacBook Pro" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                    <SelectContent><SelectGroup>
                      {Object.values(AssetType).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectGroup></SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Details & Logistics</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="vendor" render={({ field }) => (
                <FormItem><FormLabel>Vendor</FormLabel><FormControl><Input placeholder="e.g. Apple" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="model" render={({ field }) => (
                <FormItem><FormLabel>Model</FormLabel><FormControl><Input placeholder="e.g. M3 Pro" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="purchaseUrl" render={({ field }) => (
                <FormItem><FormLabel>Purchase URL</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormControl><Textarea placeholder="Additional details..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          {isCreate && (
            <Card className="md:col-span-2">
              <CardHeader><CardTitle>Images</CardTitle></CardHeader>
              <CardContent>
                <FormField control={form.control} name="images" render={({ field }) => (
                  <FormItem><FormControl><ImageUpload value={field.value ?? []} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isCreate ? "Save Asset" : "Update Asset"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
