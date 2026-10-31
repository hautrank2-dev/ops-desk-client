"use client";

import { createContext, useContext } from "react";
import { useChatWidget } from "@/components/ai/chat-widget/hook";

type AgentContextValue = ReturnType<typeof useChatWidget>;

const AgentContext = createContext<AgentContextValue | null>(null);

// Agent state lives above the page so any screen can open the chat and ask
// something; ChatWidget is only one consumer.
export function AgentProvider({ children }: { children: React.ReactNode }) {
  const agent = useChatWidget();
  return <AgentContext.Provider value={agent}>{children}</AgentContext.Provider>;
}

export function useAgent() {
  const agent = useContext(AgentContext);
  if (!agent) throw new Error("useAgent must be used inside AgentProvider");
  return agent;
}
