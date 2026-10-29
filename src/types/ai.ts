export type AiChatRole = "user" | "assistant";

export type AiTicketRankingItem = {
  ticketId: string;
  code: string;
  title: string;
  priority: string;
  status: string;
  score: number;
  reasons: string[];
};

// Structured output the assistant emits alongside its text (server `card` event).
export type AiCardModel = {
  type: "ticket_ranking";
  data: { title: string; items: AiTicketRankingItem[] };
};

export type AiMessageModel = {
  role: AiChatRole;
  text: string;
  cards: AiCardModel[];
  createdAt: string;
};

export type AiConversationSummaryModel = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiConversationModel = AiConversationSummaryModel & {
  messages: AiMessageModel[];
};
