"use client";

import { ChatWidget } from "@/components/ai/chat-widget";
import { MainLayout } from "@/components/layout/MainLayout";
import { AgentProvider } from "@/contexts/AgentContext";
import { AppProvider } from "@/contexts/AppContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AgentProvider>
        <MainLayout>{children}</MainLayout>
        <ChatWidget />
      </AgentProvider>
    </AppProvider>
  );
}