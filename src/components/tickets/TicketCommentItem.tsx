"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Edit2, Trash, Save, ImageIcon } from "lucide-react";

import { httpClient } from "@/lib/httpClient";
import { fileUrl } from "@/lib/fileUrl";
import { TicketCommentModel } from "@/types/ticket-comment";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/image-upload";
import { PopupConfirm } from "@/components/ui/popup-confirm";
import { useApp } from "@/contexts/AppContext";

const updateSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  images: z.array(z.instanceof(File)).max(5, "Maximum 5 images allowed").optional(),
});

type UpdateFormValues = z.infer<typeof updateSchema>;

interface TicketCommentItemProps {
  comment: TicketCommentModel;
  ticketId: string;
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditCancel?: () => void;
  onEditSuccess?: () => void;
  onDeleteSuccess?: () => void;
  disabled?: boolean;
}

export function TicketCommentItem({ 
  comment, 
  ticketId, 
  isEditing = false, 
  onEditStart, 
  onEditCancel,
  onEditSuccess,
  onDeleteSuccess,
  disabled = false
}: TicketCommentItemProps) {
  const queryClient = useQueryClient();
  const { authPayload } = useApp();
  const [keptImages, setKeptImages] = useState<string[]>(comment.imgUrls || []);
  
  const isOwner = authPayload?._id === comment.createdBy?._id;

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      content: comment.content,
      images: [],
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: UpdateFormValues) => {
      // 1. Update content
      if (values.content !== comment.content) {
        await httpClient.patch(`/ticket-comment/${comment._id}`, { content: values.content });
      }

      // 2. Update images if there are new files or if kept images changed
      const originalImages = comment.imgUrls || [];
      const imagesChanged = values.images && values.images.length > 0;
      const keptImagesChanged = keptImages.length !== originalImages.length || !keptImages.every(img => originalImages.includes(img));

      if (imagesChanged || keptImagesChanged) {
        const fd = new FormData();
        keptImages.forEach(url => fd.append("keepUrls[]", url));
        values.images?.forEach(f => fd.append("images", f));

        await httpClient.put(`/ticket-comment/${comment._id}/images`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-comments", ticketId] });
      onEditSuccess?.();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await httpClient.delete(`/ticket-comment/${comment._id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-comments", ticketId] });
      onDeleteSuccess?.();
    }
  });

  const onSubmit = (values: UpdateFormValues) => {
    updateMutation.mutate(values);
  };

  const handleRemoveKeptImage = (url: string) => {
    setKeptImages(prev => prev.filter(img => img !== url));
  };

  if (isEditing) {
    return (
      <div className="flex gap-3.5 p-4 rounded-2xl bg-primary/[0.04] ring-1 ring-primary/20">
        <Avatar className="h-9 w-9">
          <AvatarImage src={fileUrl(comment.createdBy?.avatar)} />
          <AvatarFallback>{comment.createdBy?.name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Current Images */}
              {keptImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Current Images:</p>
                  <div className="flex flex-wrap gap-2">
                    {keptImages.map((img, idx) => (
                      <div key={idx} className="relative h-16 w-16 rounded-lg overflow-hidden shadow-soft group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fileUrl(img)} alt={`kept-${idx}`} className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => handleRemoveKeptImage(img)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                        >
                          <Trash className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <p className="text-xs font-medium text-muted-foreground">Add New Images (Max {5 - keptImages.length}):</p>
                    <FormControl>
                      <ImageUpload
                        value={field.value ?? []}
                        onChange={field.onChange}
                        maxFiles={5 - keptImages.length}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onEditCancel?.();
                    setKeptImages(comment.imgUrls || []);
                    form.reset();
                  }}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3.5 rounded-2xl px-2 py-3 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] group ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <Avatar className="h-9 w-9">
        <AvatarImage src={fileUrl(comment.createdBy?.avatar)} />
        <AvatarFallback>{comment.createdBy?.name?.charAt(0) || "U"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between min-h-8">
          <div>
            <span className="font-semibold text-sm tracking-[-0.01em] mr-2">
              {comment.createdBy?.name || "Unknown User"}
            </span>
            <span className="text-xs text-muted-foreground">
              {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ""}
            </span>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            {isOwner && (
              <>
                <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={onEditStart} disabled={disabled}>
                  <Edit2 className="h-4 w-4 text-muted-foreground" />
                </Button>
                <PopupConfirm
                  title="Delete Comment"
                  description="Are you sure you want to delete this comment? This action cannot be undone."
                  confirmText="Delete"
                  onConfirm={async () => {
                    await deleteMutation.mutateAsync();
                  }}
                  isLoading={deleteMutation.isPending}
                  trigger={
                    <Button variant="ghost" size="icon-sm" className="rounded-full hover:bg-destructive/10" disabled={disabled || deleteMutation.isPending}>
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  }
                />
              </>
            )}
          </div>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{comment.content}</p>

        {comment.imgUrls && comment.imgUrls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {comment.imgUrls.map((img, idx) => (
              <div key={idx} className="relative h-20 w-20 rounded-xl overflow-hidden shadow-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileUrl(img)}
                  alt={`Comment attachment ${idx + 1}`}
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
