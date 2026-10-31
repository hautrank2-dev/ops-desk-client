"use client";

import { UIEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpLeft,
  ArrowUpRight,
  Bot,
  Check,
  History,
  Loader2,
  MessageCircle,
  Move,
  Plus,
  Send,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/formatDate";
import { cn } from "@/lib/utils";
import { TicketRankingCard } from "../ticket-ranking-card";
import { CHAT_CORNERS, SUGGESTED_QUESTIONS, useChatWidget } from "./hook";
import { ChatCorner, ChatToolCall, ChatUiMessage } from "./type";

// Toggle button sits in the chosen corner; the panel opens next to it, on the inner side.
const CORNER_BUTTON_CLASS: Record<ChatCorner, string> = {
  "bottom-right": "bottom-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "top-right": "top-2 right-2",
  "top-left": "top-2 left-2",
};
const CORNER_PANEL_CLASS: Record<ChatCorner, string> = {
  "bottom-right": "bottom-14 right-4",
  "bottom-left": "bottom-14 left-4",
  "top-right": "top-14 right-4",
  "top-left": "top-14 left-4",
};
const CORNER_OPTIONS: Record<ChatCorner, { label: string; icon: typeof Move }> = {
  "top-left": { label: "Top left", icon: ArrowUpLeft },
  "top-right": { label: "Top right", icon: ArrowUpRight },
  "bottom-left": { label: "Bottom left", icon: ArrowDownLeft },
  "bottom-right": { label: "Bottom right", icon: ArrowDownRight },
};

// Drop point → nearest corner by viewport half.
const cornerFromPoint = (x: number, y: number): ChatCorner =>
  `${y < window.innerHeight / 2 ? "top" : "bottom"}-${x < window.innerWidth / 2 ? "left" : "right"}` as ChatCorner;

const TOOL_LABELS: Record<string, string> = {
  search_tickets: "Searching tickets",
  get_ticket: "Reading ticket",
  get_ticket_stats: "Counting tickets",
  search_users: "Looking up users",
  present_ranking: "Building ranking",
};

const ToolStatus = ({ tool }: { tool: ChatToolCall }) => (
  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
    {tool.status === "running" ? (
      <Loader2 className="size-3 animate-spin" />
    ) : tool.status === "error" ? (
      <X className="size-3 text-destructive" />
    ) : (
      <Check className="size-3" />
    )}
    {TOOL_LABELS[tool.name] ?? tool.name}
  </span>
);

const ChatBubble = ({ message, onNavigate }: { message: ChatUiMessage; onNavigate: () => void }) => {
  const isUser = message.role === "user";
  const hasCards = !!message.cards?.length;
  return (
    <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
      {message.thinking && (
        <p className="max-w-[85%] text-xs italic text-muted-foreground/70">
          {message.thinking}
        </p>
      )}
      {!!message.tools?.length && (
        <div className="flex flex-col gap-0.5">
          {message.tools.map((tool) => (
            <ToolStatus key={tool.id} tool={tool} />
          ))}
        </div>
      )}
      {message.cards?.map((card, index) =>
        card.type === "ticket_ranking" ? (
          <TicketRankingCard key={index} data={card.data} onNavigate={onNavigate} />
        ) : null,
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : message.error
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-foreground",
        )}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap selection:text-primary selection:bg-primary-foreground">{message.text}</span>
        ) : message.text ? (
          <div className="[&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-black/[0.06] [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px] dark:[&_code]:bg-white/[0.08] [&_table]:my-2 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-xs [&_th]:border [&_th]:border-border [&_th]:bg-background/60 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold [&_th]:whitespace-nowrap [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_td]:whitespace-nowrap [&_a]:text-primary [&_a]:underline">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
          </div>
        ) : message.streaming && !hasCards ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>
    </div>
  );
};

// Whether there is content hidden above / below — drives the header / footer blur.
const getStatusScroll = (el: HTMLElement | null | undefined) => ({
  top: !!el && el.scrollTop > 0,
  bottom: !!el && el.scrollTop + el.clientHeight < el.scrollHeight - 1,
});

export const ChatWidget = () => {
  const {
    ready,
    open,
    setOpen,
    isMobile,
    corner,
    setCorner,
    historyOpen,
    toggleHistory,
    input,
    setInput,
    messages,
    isStreaming,
    conversations,
    conversationsLoading,
    sendMessage,
    stop,
    openConversation,
    startNewConversation,
    deleteConversation,
  } = useChatWidget();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(() => getStatusScroll(null));
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  // Drag the header anywhere; on release the panel snaps to the nearest corner.
  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    // React events bubble through portals: ignore pointers from the Move menu (portaled) and header buttons.
    const target = e.target as HTMLElement;
    if (isMobile || e.button !== 0 || !e.currentTarget.contains(target) || target.closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };
  const handleDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (!start) return;
    setDragOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
  };
  const handleDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    dragStart.current = null;
    if (dragOffset && Math.hypot(dragOffset.x, dragOffset.y) > 8) setCorner(cornerFromPoint(e.clientX, e.clientY));
    setDragOffset(null);
  };

  // ScrollArea's viewport is the element that scrolls; capture its scroll events here.
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrolled(getStatusScroll(e.target as HTMLElement));
  };

  // Also re-run on open / leaving history: messages restored while the panel was closed
  // never scrolled, since the list wasn't mounted. rAF waits for the panel (or Sheet) to mount.
  useEffect(() => {
    if (!open || historyOpen) return;
    const frame = requestAnimationFrame(() => {
      const anchor = scrollRef.current;
      anchor?.scrollIntoView({ block: "end" });
      // No scroll event fires when nothing moved (short list / already at bottom), so sync the state here.
      setScrolled(getStatusScroll(anchor?.closest<HTMLElement>('[data-slot="scroll-area-viewport"]')));
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, open, historyOpen]);

  if (!ready) return null;

  const submit = () => {
    void sendMessage(input);
  };

  const panelContent = (
    <div className="relative flex h-full flex-col" onScrollCapture={handleScroll}>
      <div
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        className={cn(
          "flex items-center justify-between gap-2 border-b border-border/60 absolute inset-x-0 top-0 z-10 px-4 py-3 transition-colors",
          !isMobile && (dragOffset ? "cursor-grabbing select-none" : "cursor-grab"),
          scrolled.top && "bg-popover/70 backdrop-blur-xl backdrop-saturate-150 shadow-soft",
        )}
      >
       <div className="flex items-center gap-2">
          <RobotIcon/>
          <h2 className="text-sm font-semibold">Assistant</h2>
       </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={startNewConversation} title="New chat">
            <Plus />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={toggleHistory} title="History">
            <History />
          </Button>
          {!isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" title="Move" />}>
                <Move />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {CHAT_CORNERS.filter((c) => c !== corner).map((c) => {
                  const { label, icon: Icon } = CORNER_OPTIONS[c];
                  return (
                    <DropdownMenuItem key={c} onClick={() => setCorner(c)}>
                      <Icon />
                      {label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} title="Close">
            <X />
          </Button>
        </div>
      </div>

      {historyOpen ? (
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-1 p-3 pt-16">
            {conversationsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No conversations yet.
              </p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  className="group flex items-center gap-1 rounded-lg px-2 py-2 hover:bg-muted"
                >
                  <button
                    type="button"
                    onClick={() => void openConversation(c.id)}
                    className="flex-1 truncate text-left text-sm"
                  >
                    <span className="block truncate">{c.title ?? "Untitled conversation"}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(c.updatedAt)}</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => void deleteConversation(c.id)}
                    title="Delete"
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      ) : (
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-4 p-4 pt-16 pb-20">
            {messages.length === 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  Ask me about tickets, assets, or how OpsDesk works.
                </p>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void sendMessage(q)}
                    className="rounded-xl border border-border/60 bg-card px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    {q}
                  </button>
                ))}
              </div>
            ) : (
              messages.map((m) => (
                <ChatBubble key={m.id} message={m} onNavigate={() => isMobile && setOpen(false)} />
              ))
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      )}

      {!historyOpen && (
        <div
          className={cn(
            "flex items-end gap-2 border-t border-border/60 absolute inset-x-0 bottom-0 z-10 p-3 transition-colors",
            scrolled.bottom && "bg-popover/70 backdrop-blur-xl backdrop-saturate-150 shadow-soft",
          )}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask OpsDesk Assistant…"
            className="min-h-10 flex-1 resize-none"
            rows={1}
          />
          {isStreaming ? (
            <Button variant="outline" size="icon" onClick={stop} title="Stop">
              <Square />
            </Button>
          ) : (
            <Button size="icon" onClick={submit} disabled={!input.trim()} title="Send">
              <Send />
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Button
        size="icon-lg"
        onClick={() => setOpen((v) => !v)}
        className={cn("fixed z-50 rounded-full shadow-float", isMobile ? CORNER_BUTTON_CLASS["bottom-right"] : CORNER_BUTTON_CLASS[corner])}
      >
        {open && !isMobile ? <X /> : <Bot />}
      </Button>

      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="flex h-[85vh] flex-col p-0" showCloseButton={false}>
            {panelContent}
          </SheetContent>
        </Sheet>
      ) : (
        open && (
          <div
            className={cn(
              "fixed z-50 flex h-[min(560px,calc(100vh-5rem))] w-[380px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-popover shadow-float",
              CORNER_PANEL_CLASS[corner],
              !dragOffset && "transition-[top,right,bottom,left] duration-300 ease-apple",
            )}
            style={dragOffset ? { transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` } : undefined}
          >
            {panelContent}
          </div>
        )
      )}
    </>
  );
};

export const RobotIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 36 36" {...props}>
    <ellipse cx="33.5" cy="14.5" fill="#f4900c" rx="2.5" ry="3.5"/><ellipse cx="2.5" cy="14.5" fill="#f4900c" rx="2.5" ry="3.5"/><path fill="#ffac33" d="M34 19a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1zM7 19a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1z"/><path fill="#ffcc4d" d="M28 5c0 2.761-4.478 4-10 4S8 7.761 8 5s4.477-5 10-5s10 2.239 10 5"/><path fill="#f4900c" d="M25 4.083C25 5.694 21.865 7 18 7s-7-1.306-7-2.917s3.134-2.917 7-2.917s7 1.306 7 2.917"/><path fill="#269" d="M30 5.5C30 6.881 28.881 7 27.5 7h-19C7.119 7 6 6.881 6 5.5S7.119 3 8.5 3h19A2.5 2.5 0 0 1 30 5.5"/><path fill="#55acee" d="M30 6H6a2 2 0 0 0-2 2v26h28V8a2 2 0 0 0-2-2"/><path fill="#3b88c3" d="M35 33v-1a2 2 0 0 0-2-2H22.071l-3.364 3.364a1 1 0 0 1-1.414 0L13.929 30H3a2 2 0 0 0-2 2v1c0 1.104-.104 2 1 2h32c1.104 0 1-.896 1-2"/><circle cx="24.5" cy="14.5" r="4.5" fill="#fff"/><circle cx="24.5" cy="14.5" r="2.721" fill="#dd2e44"/><circle cx="11.5" cy="14.5" r="4.5" fill="#fff"/><path fill="#f5f8fa" d="M29 25.5a2.5 2.5 0 0 1-2.5 2.5h-17a2.5 2.5 0 1 1 0-5h17a2.5 2.5 0 0 1 2.5 2.5"/><path fill="#ccd6dd" d="M17 23h2v5h-2zm-5 0h2v5h-2zm10 0h2v5h-2zM7 25.5a2.5 2.5 0 0 0 2 2.45v-4.9a2.5 2.5 0 0 0-2 2.45m20-2.45v4.899a2.5 2.5 0 0 0 0-4.899"/><circle cx="11.5" cy="14.5" r="2.721" fill="#dd2e44"/>
  </svg>
);