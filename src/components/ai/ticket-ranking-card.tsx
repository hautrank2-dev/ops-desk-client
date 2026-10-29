"use client";

import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { TICKET_PRIORITY_TONE, TICKET_STATUS_TONE } from "@/constants/tones";
import { AiCardModel } from "@/types/ai";
import { TicketPriority, TicketStatus } from "@/types/ticket";

type Props = {
  data: AiCardModel["data"];
  onNavigate?: () => void;
};

export const TicketRankingCard = ({ data, onNavigate }: Props) => {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border/60 bg-card">
      <p className="border-b border-border/60 px-3 py-2 text-xs font-semibold">{data.title}</p>
      <ol className="flex flex-col">
        {data.items.map((item, index) => (
          <li key={item.ticketId} className="border-b border-border/40 last:border-b-0">
            <Link
              href={`/tickets/${item.ticketId}`}
              onClick={onNavigate}
              className="flex gap-2.5 px-3 py-2.5 hover:bg-muted"
            >
              <span className="w-4 shrink-0 pt-0.5 text-xs font-semibold text-muted-foreground">
                {index + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{item.code}</span>
                  <span className="ml-auto text-xs font-semibold tabular-nums">{item.score}</span>
                </div>
                <span className="line-clamp-2 text-sm leading-snug">{item.title}</span>
                <div className="flex flex-wrap gap-1">
                  <StatusPill tone={TICKET_PRIORITY_TONE[item.priority as TicketPriority] ?? "gray"}>
                    {item.priority}
                  </StatusPill>
                  <StatusPill dot tone={TICKET_STATUS_TONE[item.status as TicketStatus] ?? "gray"}>
                    {item.status}
                  </StatusPill>
                </div>
                {item.reasons.length > 0 && (
                  <ul className="list-disc pl-4 text-xs text-muted-foreground">
                    {item.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
};
