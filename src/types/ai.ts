export type AiChatRole = "user" | "assistant";

export type AiMessageModel = {
  role: AiChatRole;
  text: string;
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
