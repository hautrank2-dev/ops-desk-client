"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  History,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/formatDate";
import { cn } from "@/lib/utils";
import { SUGGESTED_QUESTIONS, useChatWidget } from "./hook";
import { ChatUiMessage } from "./type";

const ChatBubble = ({ message }: { message: ChatUiMessage }) => {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
      {message.thinking && (
        <p className="max-w-[85%] text-xs italic text-muted-foreground/70">
          {message.thinking}
        </p>
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
          <span className="whitespace-pre-wrap">{message.text}</span>
        ) : message.text ? (
          <div className="[&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-black/[0.06] [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px] dark:[&_code]:bg-white/[0.08]">
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
        ) : message.streaming ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>
    </div>
  );
};

export const ChatWidget = () => {
  const {
    ready,
    open,
    setOpen,
    isMobile,
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

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  if (!ready) return null;

  const submit = () => {
    void sendMessage(input);
  };

  const panelContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <h2 className="text-sm font-semibold">OpsDesk Assistant</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={startNewConversation} title="New chat">
            <Plus />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={toggleHistory} title="History">
            <History />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} title="Close">
            <X />
          </Button>
        </div>
      </div>

      {historyOpen ? (
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 p-3">
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
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-4 p-4">
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
              messages.map((m) => <ChatBubble key={m.id} message={m} />)
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      )}

      {!historyOpen && (
        <div className="flex items-end gap-2 border-t border-border/60 p-3">
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
        className="fixed bottom-6 right-6 z-50 rounded-full shadow-float"
      >
        {open && !isMobile ? <X /> : <MessageCircle />}
      </Button>

      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="flex h-[85vh] flex-col p-0" showCloseButton={false}>
            {panelContent}
          </SheetContent>
        </Sheet>
      ) : (
        open && (
          <div className="fixed bottom-24 right-6 z-50 flex h-[560px] w-[380px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-popover shadow-float">
            {panelContent}
          </div>
        )
      )}
    </>
  );
};
