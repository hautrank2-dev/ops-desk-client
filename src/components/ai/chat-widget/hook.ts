import { useEffect, useRef, useState } from "react";
import { usePathname, useParams } from "next/navigation";
import { httpClient } from "@/lib/httpClient";
import { LOCAL_KEYS } from "@/constants/local";
import { useApp } from "@/contexts/AppContext";
import {
  AiConversationModel,
  AiConversationSummaryModel,
  TableResponse,
} from "@/types";
import { ChatCorner, ChatSseEvent, ChatUiMessage } from "./type";

export const SUGGESTED_QUESTIONS = [
  "What's the hardest and most urgent ticket?",
  "How do I create a new ticket?",
  "Summarize tickets that are overdue.",
  "What can you help me with?",
];

export const CHAT_CORNERS: ChatCorner[] = ["top-left", "top-right", "bottom-left", "bottom-right"];

const genLocalId = () =>
  `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// SSE events arrive as "event: X\ndata: {...}\n\n" blocks over one HTTP
// stream — parse the blocks that have fully arrived, keep the rest buffered.
const parseSseChunk = (buffer: string): { events: ChatSseEvent[]; rest: string } => {
  const blocks = buffer.split("\n\n");
  const rest = blocks.pop() ?? "";
  const events: ChatSseEvent[] = [];
  for (const block of blocks) {
    const eventLine = block.split("\n").find((l) => l.startsWith("event:"));
    const dataLine = block.split("\n").find((l) => l.startsWith("data:"));
    if (!eventLine || !dataLine) continue;
    const event = eventLine.slice("event:".length).trim();
    try {
      const data = JSON.parse(dataLine.slice("data:".length).trim());
      events.push({ event, data } as ChatSseEvent);
    } catch {
      // malformed block — ignore rather than crash the stream
    }
  }
  return { events, rest };
};

export function useChatWidget() {
  const { authPayload } = useApp();
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const ticketId = pathname.startsWith("/tickets/") && params.id ? params.id : undefined;

  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversations, setConversations] = useState<AiConversationSummaryModel[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  const [corner, setCornerState] = useState<ChatCorner>("bottom-right");

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEYS.AI_WIDGET_CORNER);
    if (CHAT_CORNERS.includes(saved as ChatCorner)) setCornerState(saved as ChatCorner);
  }, []);

  const setCorner = (next: ChatCorner) => {
    setCornerState(next);
    localStorage.setItem(LOCAL_KEYS.AI_WIDGET_CORNER, next);
  };

  // Reopen the in-progress conversation after a reload (conversationId is
  // stored locally, messages are refetched from the server).
  useEffect(() => {
    const savedId = localStorage.getItem(LOCAL_KEYS.AI_CONVERSATION_ID);
    if (savedId) void openConversation(savedId, { keepOpenState: true });
  }, []);

  // Fixed panel on desktop, Sheet on mobile — Sheet portals to document.body,
  // so the choice must be made in JS; CSS show/hide can't stop the portal.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const loadConversations = async () => {
    setConversationsLoading(true);
    try {
      const { data } = await httpClient.get<TableResponse<AiConversationSummaryModel>>(
        "/ai/conversations",
        { params: { page: 1, pageSize: 20 } },
      );
      setConversations(data.items);
    } catch {
      /* silent — history list is a convenience, not critical */
    } finally {
      setConversationsLoading(false);
    }
  };

  const toggleHistory = () => {
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next) void loadConversations();
  };

  const openConversation = async (id: string, opts?: { keepOpenState?: boolean }) => {
    try {
      const { data } = await httpClient.get<AiConversationModel>(`/ai/conversations/${id}`);
      setConversationId(data.id);
      setMessages(
        data.messages.map((m) => ({
          id: genLocalId(),
          role: m.role,
          text: m.text,
          cards: m.cards,
        })),
      );
      localStorage.setItem(LOCAL_KEYS.AI_CONVERSATION_ID, data.id);
      if (!opts?.keepOpenState) setHistoryOpen(false);
    } catch {
      localStorage.removeItem(LOCAL_KEYS.AI_CONVERSATION_ID);
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setHistoryOpen(false);
    localStorage.removeItem(LOCAL_KEYS.AI_CONVERSATION_ID);
  };

  const deleteConversation = async (id: string) => {
    try {
      await httpClient.delete(`/ai/conversations/${id}`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === conversationId) startNewConversation();
    } catch {
      /* silent */
    }
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  const sendMessage = async (text: string) => {
    const message = text.trim();
    if (!message || isStreaming) return;

    setInput("");
    const userMsg: ChatUiMessage = { id: genLocalId(), role: "user", text: message };
    const assistantId = genLocalId();
    const assistantMsg: ChatUiMessage = {
      id: assistantId,
      role: "assistant",
      text: "",
      thinking: "",
      tools: [],
      cards: [],
      streaming: true,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const patchAssistant = (patch: Partial<ChatUiMessage>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)),
      );
    };

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = localStorage.getItem(LOCAL_KEYS.TOKEN);
      const baseUrl = httpClient.defaults.baseURL ?? "/api";
      // The only place using fetch instead of httpClient: chat is SSE over POST,
      // and EventSource can't send a POST body.
      const response = await fetch(`${baseUrl}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          message,
          context: { route: pathname, ticketId },
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        patchAssistant({ streaming: false, error: true, text: "Could not reach the AI service." });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let hasText = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { events, rest } = parseSseChunk(buffer);
        buffer = rest;

        for (const evt of events) {
          if (evt.event === "meta") {
            setConversationId(evt.data.conversationId);
            localStorage.setItem(LOCAL_KEYS.AI_CONVERSATION_ID, evt.data.conversationId);
          } else if (evt.event === "thinking") {
            assistantMsg.thinking = (assistantMsg.thinking ?? "") + evt.data.text;
            patchAssistant({ thinking: assistantMsg.thinking });
          } else if (evt.event === "tool") {
            const tools = assistantMsg.tools ?? [];
            const exists = tools.some((t) => t.id === evt.data.id);
            assistantMsg.tools = exists
              ? tools.map((t) => (t.id === evt.data.id ? evt.data : t))
              : [...tools, evt.data];
            patchAssistant({ tools: assistantMsg.tools });
          } else if (evt.event === "card") {
            assistantMsg.cards = [...(assistantMsg.cards ?? []), evt.data];
            patchAssistant({ cards: assistantMsg.cards });
          } else if (evt.event === "text") {
            hasText = true;
            assistantMsg.text += evt.data.text;
            patchAssistant({ text: assistantMsg.text });
          } else if (evt.event === "error") {
            if (hasText) {
              setMessages((prev) => [
                ...prev,
                { id: genLocalId(), role: "assistant", text: evt.data.message, error: true },
              ]);
            } else {
              patchAssistant({ error: true, text: evt.data.message, streaming: false });
            }
          }
        }
      }

      patchAssistant({ streaming: false });
    } catch (err) {
      if ((err as { name?: string }).name !== "AbortError") {
        patchAssistant({ streaming: false, error: true, text: "Connection lost. Please try again." });
      } else {
        patchAssistant({ streaming: false });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  return {
    ready: !!authPayload,
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
  };
}
