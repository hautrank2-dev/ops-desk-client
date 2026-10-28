"use client";

import { ChatWidget } from "@/components/ai/chat-widget";
import { MainLayout } from "@/components/layout/MainLayout";
import { AppProvider } from "@/contexts/AppContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <MainLayout>{children}</MainLayout>
      <ChatWidget />
    </AppProvider>
  );
}