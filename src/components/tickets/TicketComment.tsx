"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Send, ImageIcon, X } from "lucide-react";

import { httpClient } from "@/lib/httpClient";
import { cn } from "@/lib/utils";
import { TicketCommentModel } from "@/types/ticket-comment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ImageGroup, Image } from "@/components/ui/image";
import { TicketCommentItem } from "./TicketCommentItem";

const MAX_IMAGES = 5;

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  images: z.array(z.instanceof(File)).max(MAX_IMAGES, `Maximum ${MAX_IMAGES} images allowed`).optional(),
});

type CommentFormValues = z.infer<typeof commentSchema>;

/** Object URLs for local previews, revoked when the files change or on unmount. */
function useObjectUrls(files: File[]) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const next = files.map((f) => URL.createObjectURL(f));
    setUrls(next);
    return () => next.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);
  return urls;
}

export function TicketComment({ ticketId }: { ticketId: string }) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: comments = [], isLoading } = useQuery<TicketCommentModel[]>({
    queryKey: ["ticket-comments", ticketId],
    queryFn: async () => {
      const { data } = await httpClient.get("/ticket-comment", { params: { ticketId } });
      return data;
    },
    enabled: !!ticketId,
  });

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "", images: [] },
  });

  const images = form.watch("images") ?? [];
  const previews = useObjectUrls(images);

  /** Returns true when at least one image was attached (so paste can be swallowed). */
  const addImages = (incoming: FileList | File[] | null | undefined) => {
    const files = Array.from(incoming ?? []).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return false;
    form.setValue("images", [...images, ...files].slice(0, MAX_IMAGES), { shouldValidate: true });
    return true;
  };

  const removeImage = (index: number) =>
    form.setValue("images", images.filter((_, i) => i !== index), { shouldValidate: true });

  const createMutation = useMutation({
    mutationFn: async (values: CommentFormValues) => {
      const fd = new FormData();
      fd.append("ticketId", ticketId);
      fd.append("content", values.content);
      values.images?.forEach((f) => fd.append("images", f));

      const { data } = await httpClient.post("/ticket-comment", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-comments", ticketId] });
      form.reset({ content: "", images: [] });
    },
  });

  const onSubmit = (values: CommentFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <Card className="mt-2">
      <CardHeader>
        <CardTitle>Comments & Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
                    }}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); addImages(e.dataTransfer.files); }}
                    className={cn(
                      "rounded-xl border border-input bg-card transition-colors dark:bg-white/[0.04]",
                      dragging && "border-primary bg-primary/[0.04] ring-4 ring-ring/15"
                    )}
                  >
                    <FormControl>
                      <Textarea
                        placeholder={dragging ? "Drop images to attach" : "Add a comment… (paste or drop images to attach)"}
                        className="min-h-[88px] border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
                        onPaste={(e) => { if (addImages(e.clipboardData.files)) e.preventDefault(); }}
                        {...field}
                      />
                    </FormControl>

                    {previews.length > 0 && (
                      <ImageGroup>
                      <div className="flex flex-wrap gap-2 px-3 pb-3">
                        {previews.map((url, i) => (
                          <div key={url} className="group relative size-16 overflow-hidden rounded-lg bg-muted shadow-soft">
                            <Image src={url} alt={`Attachment ${i + 1}`} className="size-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              aria-label="Remove image"
                              className="absolute right-1 top-1 flex size-5 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      </ImageGroup>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="images" render={() => <FormItem><FormMessage /></FormItem>} />

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { addImages(e.target.files); e.target.value = ""; }}
            />

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInput.current?.click()}
                disabled={images.length >= MAX_IMAGES}
              >
                <ImageIcon className="h-4 w-4" />
                Add Images{images.length > 0 ? ` (${images.length}/${MAX_IMAGES})` : ""}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Post
              </Button>
            </div>
          </form>
        </Form>

        {/* Comment List */}
        <div className="space-y-3 pt-5 border-t border-border">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No comments yet.
            </p>
          ) : (
            comments.map((comment) => (
              <TicketCommentItem
                key={comment._id}
                comment={comment}
                ticketId={ticketId}
                isEditing={editingId === comment._id}
                onEditStart={() => setEditingId(comment._id)}
                onEditCancel={() => setEditingId(null)}
                onEditSuccess={() => setEditingId(null)}
                onDeleteSuccess={() => setEditingId(null)}
                disabled={editingId !== null && editingId !== comment._id}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
