"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Loader2, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { ImageManager } from "@/components/ui/image-manager";
import { UserCell } from "@/components/ui/user-cell";
import { TicketModel, TicketPriority, TicketStatus, TicketType } from "@/types/ticket";
import { UserModel } from "@/types/user";
import { httpClient } from "@/lib/httpClient";
import { fileUrl } from "@/lib/fileUrl";
import { formatDate } from "@/lib/formatDate";
import { TicketComment } from "./TicketComment";
import { UserSelect } from "@/components/selects/UserSelect";
import { StatusPill } from "@/components/ui/status-pill";
import { TICKET_PRIORITY_TONE, TICKET_STATUS_TONE } from "@/constants/tones";
import { CopyButton } from "@/components/ui/copy-button";

const ticketSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  type: z.enum(["Repair", "Maintenance", "Request", "Incident"] as const),
  priority: z.enum(["Low", "Medium", "High", "Urgent"] as const),
  status: z.enum(["New", "Assigned", "Doing", "Waiting", "Done", "Cancelled"] as const),
  description: z.string().optional(),
  cause: z.string().optional(),
  note: z.string().optional(),
  assigneeId: z.string().optional(),
  dueAt: z.string().optional(),
  images: z.array(z.instanceof(File)).optional(),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

const idOf = (user?: string | UserModel | null) => (typeof user === "string" ? user : user?._id ?? "");

export function TicketForm({ id }: { id?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: ticket, isLoading, isFetching, refetch } = useQuery<TicketModel>({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const { data } = await httpClient.get(`/ticket/${id}`, {
        params: { populations: ["assigneeId", "createdBy", "updatedBy"] },
      });
      return data;
    },
    enabled: isEdit,
  });

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      code: "", title: "",
      type: TicketType.Repair, priority: TicketPriority.Medium, status: TicketStatus.New,
      description: "", cause: "", note: "", assigneeId: "", dueAt: "", images: [],
    },
  });

  useEffect(() => {
    if (ticket) {
      form.reset({
        code: ticket.code, title: ticket.title,
        type: ticket.type, priority: ticket.priority, status: ticket.status,
        description: ticket.description ?? "", cause: ticket.cause ?? "", note: ticket.note ?? "",
        assigneeId: idOf(ticket.assigneeId),
        dueAt: ticket.dueAt ? ticket.dueAt.slice(0, 10) : "",
        images: [],
      });
    }
  }, [ticket, form]);

  const createMutation = useMutation({
    mutationFn: async (values: TicketFormValues) => {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (k === "images") return;
        if (k === "dueAt" && v) return fd.append(k, new Date(`${v}T23:59:59`).toISOString());
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
      const { images: _, code, assigneeId, dueAt, ...rest } = values;
      const { data } = await httpClient.patch(`/ticket/${id}`, {
        ...rest,
        assigneeId: assigneeId || null,
        dueAt: dueAt ? new Date(`${dueAt}T23:59:59`).toISOString() : null,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const onSubmit = (values: TicketFormValues) => isEdit ? updateMutation.mutate(values) : createMutation.mutate(values);

  if (isEdit && isLoading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const countBadge = (n: number) => n > 0 && (
    <span className="ml-0.5 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-primary/12 text-primary px-1.5 text-[11px] font-semibold tabular-nums">
      {n}
    </span>
  );

  const infoContent = (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <FormField control={form.control} name="code" render={({ field }) => (
            <FormItem><FormLabel>Ticket Code</FormLabel><FormControl><Input placeholder="TKT-001" disabled={isEdit} {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g. AC leaking in Room 302" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
                <FormControl><SelectTrigger><SelectValue placeholder="Select priority">{(v: TicketPriority) => <StatusPill tone={TICKET_PRIORITY_TONE[v]}>{v}</StatusPill>}</SelectValue></SelectTrigger></FormControl>
                <SelectContent>{Object.values(TicketPriority).map((p) => <SelectItem key={p} value={p}><StatusPill tone={TICKET_PRIORITY_TONE[p]}>{p}</StatusPill></SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select status">{(v: TicketStatus) => <StatusPill dot tone={TICKET_STATUS_TONE[v]}>{v}</StatusPill>}</SelectValue></SelectTrigger></FormControl>
                <SelectContent>{Object.values(TicketStatus).map((s) => <SelectItem key={s} value={s}><StatusPill dot tone={TICKET_STATUS_TONE[s]}>{s}</StatusPill></SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="dueAt" render={({ field }) => (
            <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="cause" render={({ field }) => (
          <FormItem><FormLabel>Root Cause</FormLabel><FormControl><Input placeholder="e.g. Blocked drainage pipe" {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Detailed description of the issue..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="note" render={({ field }) => (
          <FormItem><FormLabel>Internal Note</FormLabel><FormControl><Textarea placeholder="Any internal notes..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <FormField control={form.control} name="assigneeId" render={({ field }) => (
          <FormItem >
            <FormLabel>Assignee</FormLabel>
            <UserSelect
              value={field.value ?? ""}
              onChange={field.onChange}
              initialUser={typeof ticket?.assigneeId === "object" ? ticket.assigneeId : null}
              placeholder="Unassigned"
              noneLabel="Unassigned"
              className="h-auto min-h-14 rounded-xl py-2"
            />
            <FormMessage />
          </FormItem>
        )} />

        {!isEdit && (
          <FormField control={form.control} name="images" render={({ field }) => (
            <FormItem>
              <FormLabel>Images</FormLabel>
              <FormControl><ImageUpload value={field.value ?? []} onChange={field.onChange} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {isEdit && ticket && (
              <>
                <span className="flex items-center gap-2">Created by <UserCell user={ticket.createdBy} /> · {formatDate(ticket.createdAt)}</span>
                {ticket.updatedBy && <span className="flex items-center gap-2">Updated by <UserCell user={ticket.updatedBy} /></span>}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {updateMutation.isSuccess && !form.formState.isDirty && <span className="text-[13px] text-muted-foreground">Saved</span>}
            {!isEdit && <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>}
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEdit ? "Save" : "Create Ticket"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const infoForm = (
    <Form {...form}>
      <form id="ticket-form" onSubmit={form.handleSubmit(onSubmit)}>{infoContent}</form>
    </Form>
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
            <h1 className="text-xl leading-tight font-semibold tracking-[-0.02em] truncate">{isEdit ? ticket?.title : "New Ticket"}</h1>
            <div className="text-[13px] text-muted-foreground mt-0.5 flex items-center gap-2 truncate">
              {isEdit ? (
                <>
                  <span className="inline-flex items-center gap-1"><span className="font-mono">{ticket?.code}</span><CopyButton value={ticket?.code} /></span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5">Assigned to <UserCell user={ticket?.assigneeId} /></span>
                </>
              ) : "Create a new maintenance ticket"}
            </div>
          </div>
        </div>
        {isEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => {
              void refetch();
              void queryClient.invalidateQueries({ queryKey: ["ticket-comments", id] });
            }}
          >
            <RefreshCw className={cn(isFetching && "animate-spin")} />
            Reload
          </Button>
        )}
      </div>

      {isEdit && id ? (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">Images {countBadge(ticket?.imageUrls?.length ?? 0)}</h2>
            <ImageManager
              imageUrls={ticket?.imageUrls.map(e => fileUrl(e)) ?? []}
              basePath={`/ticket/${id}`}
              invalidateKeys={[["ticket", id], ["tickets"]]}
            />
          </section>

          {infoForm}


          <TicketComment ticketId={id} />
        </div>
      ) : (
        infoForm
      )}
    </div>
  );
}
