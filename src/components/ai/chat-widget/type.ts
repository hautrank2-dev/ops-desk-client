import { AiCardModel } from "@/types/ai";

export type ChatCorner = "bottom-right" | "bottom-left" | "top-right" | "top-left";

export type ChatToolCall = {
  id: string;
  name: string;
  status: "running" | "done" | "error";
};

export type ChatUiMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  thinking?: string;
  tools?: ChatToolCall[];
  cards?: AiCardModel[];
  streaming?: boolean;
  error?: boolean;
};

export type ChatSseEvent =
  | { event: "meta"; data: { conversationId: string } }
  | { event: "thinking"; data: { text: string } }
  | { event: "text"; data: { text: string } }
  | { event: "tool"; data: ChatToolCall }
  | { event: "card"; data: AiCardModel }
  | { event: "error"; data: { message: string } }
  | { event: "done"; data: unknown };
