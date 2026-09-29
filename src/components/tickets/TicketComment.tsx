"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Send, ImageIcon, Edit2, Trash, X } from "lucide-react";

import { httpClient } from "@/lib/httpClient";
import { fileUrl } from "@/lib/fileUrl";
import { TicketCommentModel } from "@/types/ticket-comment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/image-upload";
import { TicketCommentItem } from "./TicketCommentItem";


const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  images: z.array(z.instanceof(File)).max(5, "Maximum 5 images allowed").optional(),
});

type CommentFormValues = z.infer<typeof commentSchema>;

export function TicketComment({ ticketId }: { ticketId: string }) {
  const queryClient = useQueryClient();
  const [showImageUpload, setShowImageUpload] = useState(false);
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
    defaultValues: {
      content: "",
      images: [],
    },
  });

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
      setShowImageUpload(false);
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
                  <FormControl>
                    <Textarea
                      placeholder="Add a comment or update..."
                      className="min-h-[88px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showImageUpload && (
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[13px] font-medium">Attach Images (Max 5)</span>
                      <Button type="button" variant="ghost" size="icon-sm" className="rounded-full text-muted-foreground" onClick={() => {
                        setShowImageUpload(false);
                        form.setValue("images", []);
                      }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormControl>
                      <ImageUpload value={field.value ?? []} onChange={field.onChange} maxFiles={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowImageUpload(true)}
                disabled={showImageUpload}
              >
                <ImageIcon className="h-4 w-4" />
                Add Images
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
