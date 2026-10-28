"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Pencil, Loader2, Calendar, User, MapPin, Tag, AlertCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TicketModel, TicketPriority, TicketStatus } from "@/types/ticket";
import { httpClient } from "@/lib/httpClient";
import { fileUrl } from "@/lib/fileUrl";
import { formatDate, formatDateFull } from "@/lib/formatDate";
import { UserCell } from "@/components/ui/user-cell";
import { StatusPill } from "@/components/ui/status-pill";
import { ImageGroup, Image } from "@/components/ui/image";
import { PageHeader } from "@/components/layout/PageHeader";
import { TICKET_PRIORITY_TONE, TICKET_STATUS_TONE } from "@/constants/tones";


function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="text-[13px] text-muted-foreground w-28 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );
}

export function TicketDetail({ id }: { id: string }) {
  const router = useRouter();

  const { data: ticket, isLoading } = useQuery<TicketModel>({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const { data } = await httpClient.get(`/ticket/${id}`);
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-muted-foreground">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <AlertCircle className="h-6 w-6 text-muted-foreground/70" />
        </span>
        <p className="text-sm">Ticket not found.</p>
      </div>
    );
  }

  const imageUrls = ticket.imageUrls ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        onBack={() => router.back()}
        eyebrow={
          <>
            <span className="font-mono text-[13px] text-muted-foreground">{ticket.code}</span>
            <StatusPill dot tone={TICKET_STATUS_TONE[ticket.status]}>{ticket.status}</StatusPill>
            <StatusPill tone={TICKET_PRIORITY_TONE[ticket.priority]}>{ticket.priority}</StatusPill>
          </>
        }
        title={ticket.title}
        actions={
          <Link href={`/tickets/${id}/edit`}>
            <Button variant="outline">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {/* Main info */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="divide-y divide-border -mt-2">
              <InfoRow label="Type">
                <StatusPill>{ticket.type}</StatusPill>
              </InfoRow>
              <InfoRow label="Priority">
                <StatusPill tone={TICKET_PRIORITY_TONE[ticket.priority]}>{ticket.priority}</StatusPill>
              </InfoRow>
              <InfoRow label="Status">
                <StatusPill dot tone={TICKET_STATUS_TONE[ticket.status]}>{ticket.status}</StatusPill>
              </InfoRow>
              {ticket.cause && (
                <InfoRow label="Root Cause">{ticket.cause}</InfoRow>
              )}
              {ticket.note && (
                <InfoRow label="Note">
                  <span className="text-muted-foreground">{ticket.note}</span>
                </InfoRow>
              )}
              {ticket.dueAt && (
                <InfoRow label="Due Date">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDateFull(ticket.dueAt)}
                  </span>
                </InfoRow>
              )}
              {ticket.closedAt && (
                <InfoRow label="Closed At">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDateFull(ticket.closedAt)}
                  </span>
                </InfoRow>
              )}
            </CardContent>
          </Card>

          {ticket.description && (
            <Card>
              <CardHeader><CardTitle>Description</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{ticket.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Images */}
          {imageUrls.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Images <span className="text-muted-foreground font-normal text-xs ml-1">({imageUrls.length})</span></CardTitle></CardHeader>
              <CardContent>
                <ImageGroup>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {imageUrls.map((path, i) => {
                    const url = fileUrl(path);
                    return (
                      <div key={i} className="group aspect-square rounded-xl overflow-hidden bg-muted shadow-soft">
                        <Image src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 ease-apple group-hover:scale-[1.03]" />
                      </div>
                    );
                  })}
                </div>
                </ImageGroup>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>People</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Created by</p>
                <UserCell user={ticket.createdBy} />
              </div>
              {ticket.updatedBy && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Last updated by</p>
                    <UserCell user={ticket.updatedBy} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Timestamps</CardTitle></CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Created</span>
                <span className="text-xs" title={formatDateFull(ticket.createdAt)}>{formatDate(ticket.createdAt)}</span>
              </div>
              {ticket.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Updated</span>
                  <span className="text-xs" title={formatDateFull(ticket.updatedAt)}>{formatDate(ticket.updatedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {ticket.assetItemIds?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Asset Items</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {ticket.assetItemIds.map((itemId) => (
                    <div key={itemId} className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground rounded-md bg-muted/70 px-2 py-1.5">
                      <Tag className="h-3 w-3" />
                      {itemId.slice(-8).toUpperCase()}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}
