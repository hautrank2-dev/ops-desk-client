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
import { ChatSseEvent, ChatUiMessage } from "./type";

export const SUGGESTED_QUESTIONS = [
  "What's the hardest and most urgent ticket?",
  "How do I create a new ticket?",
  "Summarize tickets that are overdue.",
  "What can you help me with?",
];

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

  // AppContext đọc authPayload từ localStorage trong initializer của
  // useState, nên SSR luôn thấy null còn client thấy giá trị thật ngay —
  // render theo authed trực tiếp sẽ vỡ hydration (server: null, client:
  // button). Đợi qua 1 effect để lần render đầu trên client khớp SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversations, setConversations] = useState<AiConversationSummaryModel[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Mở lại đúng hội thoại đang dở sau khi F5 (conversationId lưu local,
  // tin nhắn lấy lại từ server).
  useEffect(() => {
    const savedId = localStorage.getItem(LOCAL_KEYS.AI_CONVERSATION_ID);
    if (savedId) void openConversation(savedId, { keepOpenState: true });
  }, []);

  // Panel cố định trên desktop, Sheet trên mobile — Sheet portal ra
  // document.body nên phải chọn 1 trong 2 bằng JS, CSS ẩn/hiện không chặn được portal.
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
      // Ngoại lệ duy nhất dùng fetch thay httpClient: chat là SSE qua POST,
      // EventSource không gửi được body POST.
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
    ready: mounted && !!authPayload,
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
  };
}
