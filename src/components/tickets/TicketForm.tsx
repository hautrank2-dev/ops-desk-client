"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/ui/image-upload";
import { ImageManager } from "@/components/ui/image-manager";
import { TicketModel, TicketPriority, TicketStatus, TicketType } from "@/types/ticket";
import { httpClient } from "@/lib/httpClient";
import { fileUrl } from "@/lib/fileUrl";
import { TicketComment } from "./TicketComment";

const ticketSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  type: z.enum(["Repair", "Maintenance", "Request", "Incident"] as const),
  priority: z.enum(["Low", "Medium", "High", "Urgent"] as const),
  status: z.enum(["New", "Assigned", "Doing", "Waiting", "Done", "Cancelled"] as const),
  description: z.string().optional(),
  cause: z.string().optional(),
  note: z.string().optional(),
  images: z.array(z.instanceof(File)).optional(),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

export function TicketForm({ id }: { id?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: ticket, isLoading } = useQuery<TicketModel>({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const { data } = await httpClient.get(`/ticket/${id}`);
      return data;
    },
    enabled: isEdit,
  });

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      code: "", title: "",
      type: TicketType.Repair, priority: TicketPriority.Medium, status: TicketStatus.New,
      description: "", cause: "", note: "", images: [],
    },
  });

  useEffect(() => {
    if (ticket) {
      form.reset({
        code: ticket.code, title: ticket.title,
        type: ticket.type, priority: ticket.priority, status: ticket.status,
        description: ticket.description ?? "", cause: ticket.cause ?? "", note: ticket.note ?? "",
        images: [],
      });
    }
  }, [ticket, form]);

  const createMutation = useMutation({
    mutationFn: async (values: TicketFormValues) => {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (k === "images") return;
        if (v) fd.append(k, v as string);
      });
      values.images?.forEach((f) => fd.append("images", f));
      const { data } = await httpClient.post("/ticket", fd, { headers: { "Content-Type": "multipart/form-data" } });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tickets"] }); router.push("/tickets"); },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: TicketFormValues) => {
      const { images: _, code, ...rest } = values;
      const { data } = await httpClient.patch(`/ticket/${id}`, rest);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      router.push("/tickets");
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const onSubmit = (values: TicketFormValues) => isEdit ? updateMutation.mutate(values) : createMutation.mutate(values);

  if (isEdit && isLoading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const infoContent = (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Ticket Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="code" render={({ field }) => (
              <FormItem><FormLabel>Ticket Code</FormLabel><FormControl><Input placeholder="TKT-001" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g. AC leaking in Room 302" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                    <SelectContent>{Object.values(TicketType).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl>
                    <SelectContent>{Object.values(TicketPriority).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                  <SelectContent>{Object.values(TicketStatus).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Analysis & Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="cause" render={({ field }) => (
              <FormItem><FormLabel>Root Cause</FormLabel><FormControl><Input placeholder="e.g. Blocked drainage pipe" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="note" render={({ field }) => (
              <FormItem><FormLabel>Internal Note</FormLabel><FormControl><Textarea placeholder="Any internal notes..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardContent>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormControl><Textarea placeholder="Detailed description of the issue..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>

        {!isEdit && (
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Images</CardTitle></CardHeader>
            <CardContent>
              <FormField control={form.control} name="images" render={({ field }) => (
                <FormItem>
                  <FormControl><ImageUpload value={field.value ?? []} onChange={field.onChange} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="sticky top-[var(--header-height)] z-20 -mx-4 -mt-6 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:-mt-8 md:px-8 py-3.5 glass border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-card text-foreground/70 shadow-soft transition-all duration-200 ease-apple hover:text-foreground active:scale-95"
          >
            <ChevronLeft className="size-5 -translate-x-px" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl leading-tight font-semibold tracking-[-0.02em] truncate">{isEdit ? "Edit Ticket" : "New Ticket"}</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5 truncate">
              {isEdit ? `Editing ${ticket?.code}` : "Create a new maintenance ticket"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" form="ticket-form" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? "Update Ticket" : "Create Ticket"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form id="ticket-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {isEdit ? (
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="images">
                  Images
                  {(ticket?.imageUrls?.length ?? 0) > 0 && (
                    <span className="ml-0.5 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-primary/12 text-primary px-1.5 text-[11px] font-semibold tabular-nums">
                      {ticket?.imageUrls?.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-5">
                {infoContent}
              </TabsContent>

              <TabsContent value="images" className="mt-5">
                <Card>
                  <CardHeader><CardTitle>Images</CardTitle></CardHeader>
                  <CardContent>
                    <ImageManager
                      imageUrls={ticket?.imageUrls.map(e => fileUrl(e)) ?? []}
                      basePath={`/ticket/${id}`}
                      invalidateKeys={[["ticket", id], ["tickets"]]}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            infoContent
          )}
        </form>
      </Form>

      {isEdit && id && (
        <TicketComment ticketId={id} />
      )}
    </div>
  );
}
